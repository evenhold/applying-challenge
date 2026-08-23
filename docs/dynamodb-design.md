# Diseño DynamoDB — Mini Onboarding

## Estrategia: Single Table Design

Una sola tabla `merchants` maneja todos los access patterns. Esto evita joins, reduce latencia y simplifica la infraestructura.

## ¿Por qué una sola tabla?

El **Single Table Design** significa que toda la data vive en una sola tabla DynamoDB. Las diferentes "entidades" se distinguen por los patrones de PK/SK:

```
Tabla: merchants
├── PK: MERCHANT#abc-123  SK: PROFILE     → datos del merchant
├── PK: MERCHANT#abc-123  SK: LOG#2026-08 → logs de actividad
├── PK: SELLER#seller-456 SK: PROFILE     → datos del seller (si se necesitan)
└── PK: SELLER#seller-456 SK: CONFIG      → configuración del seller
```

## ¿Por qué no hay tabla de sellers?

Los sellers **viven en Cognito** (authentication), no en DynamoDB:

| Dato | Dónde vive | Por qué |
|------|-----------|---------|
| Email, password, MFA | Cognito User Pool | Auth nativa, manejo de tokens |
| `sellerId` | DynamoDB (como string) | Solo referencia, no data del seller |
| Nombre, empresa, config | Cognito o DynamoDB (si se necesita) | Depende del futuro |

```
Cognito:  seller-456 → email, password, tokens, MFA
DynamoDB: MERCHANT#abc-123 → sellerId: "seller-456" (solo referencia)
```

Si en el futuro necesitamos datos del seller en DynamoDB (nombre, empresa, configuración), usamos la misma tabla con un PK diferente: `PK: SELLER#<sellerId>, SK: PROFILE`.

## Tabla Principal

**Nombre**: `merchants`

### Keys

Las Keys son los campos que DynamoDB usa para **almacenar y buscar** datos. Cada item tiene un PK (Partition Key) y SK (Sort Key) únicos.

| Attribute | Tipo   | Descripción        |
| --------- | ------ | ------------------ |
| `PK`      | String | Partition key — identifica la partición donde está el dato |
| `SK`      | String | Sort key — ordena los items dentro de una partición |
| `GSI1PK`  | String | GSI1 partition key — permite consultar por seller |
| `GSI1SK`  | String | GSI1 sort key — ordena por fecha de creación |
| `GSI2PK`  | String | GSI2 partition key — permite consultar por estado |
| `GSI2SK`  | String | GSI2 sort key — ordena por fecha |

**Ejemplo de uso:**
```
PK: MERCHANT#abc-123    SK: PROFILE     → datos del merchant
PK: MERCHANT#abc-123    SK: LOG#2026-08 → log de actividad
PK: MERCHANT#abc-123    SK: DOC#001     → documento adjunto
```

Un solo `PK` puede tener múltiples `SK` — eso es lo que hace posible el single table design.

Los **GSIs (Global Secondary Indexes)** son índices invertidos que permiten consultar la tabla desde otra perspectiva:
- **GSI1**: "¿Qué merchants tiene este seller?"
- **GSI2**: "¿Qué merchants están en este estado?"

### Attributes

Los Attributes son los **datos del negocio**. Todo va en la misma tabla — las Keys y los Attributes son parte del mismo item:

```json
{
  "PK": "MERCHANT#abc-123",
  "SK": "PROFILE",
  "GSI1PK": "SELLER#seller-456",
  "GSI1SK": "2026-08-22T10:00:00Z",
  "GSI2PK": "STATUS#pending_enrichment",
  "GSI2SK": "2026-08-22T10:00:00Z",
  "id": "MERCHANT#abc-123",
  "documentType": "ruc",
  "documentNumber": "20123456789",
  "businessName": "",
  "address": "",
  "phone": "",
  "sellerId": "seller-456",
  "status": "pending_enrichment",
  "createdAt": "2026-08-22T10:00:00Z",
  "updatedAt": "2026-08-22T10:00:00Z"
}
```

| Attribute        | Tipo   | Descripción                         |
| ---------------- | ------ | ----------------------------------- |
| `id`             | String | Merchant ID único                   |
| `documentType`   | String | Document type: `ruc`, `dni`, `ce`   |
| `documentNumber` | String | Document number (11 digits for RUC) |
| `businessName`   | String | Business name (from SUNAT)          |
| `address`        | String | Fiscal address (from SUNAT)         |
| `phone`          | String | Phone number                        |
| `sellerId`       | String | ID del seller propietario           |
| `status`         | String | Estado del merchant                 |
| `createdAt`      | String | ISO 8601 timestamp                  |
| `updatedAt`      | String | ISO 8601 timestamp                  |

## Access Patterns

### AP-01: Crear Merchant

```
Operación: PutItem
PK: MERCHANT#<id>
SK: PROFILE
GSI1PK: SELLER#<sellerId>
GSI1SK: <createdAt>
GSI2PK: STATUS#<status>
GSI2SK: <createdAt>
```

### AP-02: Obtener Merchant por ID

```
Operación: GetItem
PK: MERCHANT#<id>
SK: PROFILE
```

### AP-03: Listar Merchants de un Seller

```
Operación: Query en GSI1
GSI1PK: SELLER#<sellerId>
GSI1SK: DESC (más recientes primero)
```

### AP-04: Filtrar Merchants por Estado

```
Operación: Query en GSI2
GSI2PK: STATUS#<status>
GSI2SK: DESC
```

### AP-05: Actualizar Merchant (tras enricher)

```
Operación: UpdateItem
PK: MERCHANT#<id>
SK: PROFILE
UpdateExpression: SET businessName = :bn, address = :addr, status = :st, updatedAt = :now
```

### AP-06: Actualizar Merchant (confirmar, status, etc.)

```
Operación: UpdateItem
PK: MERCHANT#<id>
SK: PROFILE
UpdateExpression: SET #st = :status, updatedAt = :now
ConditionExpression: sellerId = :sellerId  -- authorization server-side
```

## Estados del Merchant

```
pending_enrichment → enriching → ready_to_submit → submitted → approved
                                                           → rejected
```

| Estado               | Descripción                                | Quién lo cambia        |
| -------------------- | ------------------------------------------ | ---------------------- |
| `pending_enrichment` | RUC validado, esperando enriquecimiento    | Lambda createMerchant  |
| `enriching`          | SQS procesando, consultando SUNAT          | Lambda enricher        |
| `ready_to_submit`    | Datos enriquecidos, seller puede confirmar | Lambda enricher        |
| `submitted`          | Seller confirmó, esperando aprobación      | Lambda confirmMerchant |
| `approved`           | Merchant aprobado                          | Sistema externo        |
| `rejected`           | Merchant rechazado                         | Sistema externo        |

## Índices Secundarios (GSIs)

### GSI1 — Por Seller

| Key    | Value               |
| ------ | ------------------- |
| GSI1PK | `SELLER#<sellerId>` |
| GSI1SK | `<createdAt>`       |

**Uso**: Listar todos los merchants de un seller, ordenados por fecha de creación.

### GSI2 — Por Estado

| Key    | Value             |
| ------ | ----------------- |
| GSI2PK | `STATUS#<status>` |
| GSI2SK | `<createdAt>`     |

**Uso**: Filtrar merchants por estado (ej. todos los `pending_enrichment`).

## Ejemplo de Items

### Merchant tras creación

```json
{
  "PK": "MERCHANT#abc-123",
  "SK": "PROFILE",
  "id": "MERCHANT#abc-123",
  "documentType": "ruc",
  "documentNumber": "20123456789",
  "businessName": "",
  "address": "",
  "email": "",
  "phone": "",
  "sellerId": "seller-456",
  "status": "pending_enrichment",
  "createdAt": "2026-08-22T10:00:00Z",
  "updatedAt": "2026-08-22T10:00:00Z",
  "GSI1PK": "SELLER#seller-456",
  "GSI1SK": "2026-08-22T10:00:00Z",
  "GSI2PK": "STATUS#pending_enrichment",
  "GSI2SK": "2026-08-22T10:00:00Z"
}
```

### Merchant tras enriquecimiento

```json
{
  "PK": "MERCHANT#abc-123",
  "SK": "PROFILE",
  "id": "MERCHANT#abc-123",
  "documentType": "ruc",
  "documentNumber": "20123456789",
  "businessName": "Empresa ABC SAC",
  "address": "Av. Principal 123, Lima",
  "email": "contacto@abc.com",
  "phone": "01-2345678",
  "sellerId": "seller-456",
  "status": "ready_to_submit",
  "createdAt": "2026-08-22T10:00:00Z",
  "updatedAt": "2026-08-22T10:05:00Z",
  "GSI1PK": "SELLER#seller-456",
  "GSI1SK": "2026-08-22T10:00:00Z",
  "GSI2PK": "STATUS#ready_to_submit",
  "GSI2SK": "2026-08-22T10:05:00Z"
}
```

## Capacity Planning

### Producción (estimación)

- **Writes**: ~100 merchants/hora = ~2.4K/día
- **Reads**: ~500 queries/hora = ~12K/día
- **Modo**: On-demand (PAY_PER_REQUEST)
- **Costo estimado**: ~$0.25/mes (escenario bajo)

### Si escala

- Cambiar a Provisioned + Auto Scaling
- DynamoDB auto-scales GSIs automáticamente
- Considerar DAX para caching si >10K QPS

## Setup Local (FLOCI)

### Crear tabla

```bash
make db-setup
```

Crea la tabla `merchants` con 2 GSIs (idempotente — no falla si ya existe).

### Insertar datos de prueba

```bash
make db-seed
```

Inserta 3 merchants en diferentes estados:

| ID | Documento | Estado | Seller |
|----|-----------|--------|--------|
| MERCHANT#test-ruc-001 | RUC 20123456786 | pending_enrichment | seller-dev-001 |
| MERCHANT#test-dni-002 | DNI 12345678 | ready_to_submit | seller-dev-001 |
| MERCHANT#test-ruc-003 | RUC 20987654321 | submitted | seller-dev-002 |

### Verificar datos

```bash
# Scan completo
make db-shell

# Reset completo (borrar + recrear + seed)
make db-reset
```

### Query por seller (ejemplo)

```bash
aws dynamodb query \
  --table-name merchants \
  --index-name GSI1 \
  --key-condition-expression "GSI1PK = :sid" \
  --expression-attribute-values '{":sid": {"S": "SELLER#seller-dev-001"}}' \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```
