# Backend - Node.js 24 + Lambda

## Estructura

```
backend/
├── src/
│   ├── handlers/
│   │   ├── health.ts          # GET /health
│   │   ├── hello.ts           # GET /hello
│   │   └── merchants.ts       # CRUD merchants
│   ├── usecases/
│   │   ├── merchants/
│   │   │   ├── create.ts      # createMerchantUseCase
│   │   │   ├── list.ts        # listMerchantsUseCase
│   │   │   ├── getById.ts     # getMerchantUseCase
│   │   │   └── update.ts      # updateMerchantUseCase
│   │   └── shared/
│   │       └── auth.ts        # extractSellerId (mock mode)
│   ├── schemas/
│   │   ├── common.ts          # documentTypeSchema, merchantStatusSchema
│   │   └── merchant.ts        # createMerchantSchema, updateMerchantSchema
│   ├── lib/
│   │   ├── dynamodb.ts        # DynamoDB CRUD client
│   │   ├── sqs.ts             # SQS enrichment message
│   │   └── ruc-validator.ts   # RUC/DNI/CE validation (módulo 11)
│   ├── types/
│   │   └── index.ts           # Tipos inferidos desde Zod
│   ├── router.ts              # Declarative routes con :params
│   └── server.ts              # HTTP server dev
├── vitest.config.ts           # Coverage 90% threshold
├── biome.json                 # Biome 2.5.8
└── package.json
```

## Stack

| Componente | Versión |
|---|---|
| Node.js | 24.x |
| TypeScript | 7.x |
| Vitest | 3.x |
| Biome | 2.5.8 |
| Zod | 3.x |
| AWS SDK | 3.x |

## Architecture

**FP Architecture** — use cases como funciones puras:

```
handler → usecase → lib (dynamodb, sqs, validator)
  ↓         ↓           ↓
input → output      side effects
```

- **Handlers**: solo despachan (HTTP concerns: parse body, send response)
- **Use cases**: lógica de negocio (funciones puras input → output)
- **Libs**: acceso a servicios externos (DynamoDB, SQS)

## Mock Auth (desarrollo local)

Para testing local sin Cognito, usar `AUTH_MOCK=true` en `.env`:

```bash
# En .env
AUTH_MOCK=true
```

Cuando `AUTH_MOCK=true`:
- Si hay JWT claims → usa el `sellerId` del JWT
- Si NO hay JWT claims → usa `"seller-dev-001"` (mock)

Esto permite probar todos los endpoints sin configurar Cognito.

> ⚠️ **NUNCA** usar `AUTH_MOCK=true` en producción.

---

## API Endpoints

### Health

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check del servicio |
| `GET` | `/hello` | No | Hello World (test endpoint) |

### Merchants

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/merchants` | Sí | Crear merchant nuevo |
| `GET` | `/merchants` | Sí | Listar merchants del seller autenticado |
| `GET` | `/merchants/:id` | Sí | Obtener merchant por ID |
| `PUT` | `/merchants/:id` | Sí | Actualizar merchant |

---

## Request Bodies

### POST /merchants

```json
{
  "documentType": "ruc",
  "documentNumber": "20123456786"
}
```

| Campo | Tipo | Requerido | Valores válidos |
|-------|------|-----------|-----------------|
| `documentType` | string | Sí | `"ruc"`, `"dni"`, `"ce"` |
| `documentNumber` | string | Sí | 11 dígitos (RUC), 8 dígitos (DNI), 12 dígitos (CE) |

### PUT /merchants/:id

```json
{
  "status": "submitted"
}
```

| Campo | Tipo | Requerido | Valores válidos |
|-------|------|-----------|-----------------|
| `businessName` | string | No | máx. 200 caracteres |
| `address` | string | No | máx. 300 caracteres |
| `email` | string | No | email válido |
| `phone` | string | No | exactamente 9 dígitos |
| `status` | string | No | Ver estados abajo |

### Estados del Merchant

```
pending_enrichment → enriching → ready_to_submit → submitted → approved
                                                            → rejected
```

| Estado | Descripción |
|--------|-------------|
| `pending_enrichment` | RUC validado, esperando enriquecimiento |
| `enriching` | SQS procesando, consultando SUNAT |
| `ready_to_submit` | Datos enriquecidos, seller puede confirmar |
| `submitted` | Seller confirmó, esperando aprobación |
| `approved` | Merchant aprobado |
| `rejected` | Merchant rechazado |

---

## Responses

### Éxito (200/201)

```json
{
  "success": true,
  "data": {
    "id": "MERCHANT#abc-123",
    "documentType": "ruc",
    "documentNumber": "20123456786",
    "businessName": "Empresa ABC SAC",
    "address": "Av. Principal 123",
    "email": "contacto@abc.com",
    "phone": "012345678",
    "sellerId": "seller-dev-001",
    "status": "pending_enrichment",
    "createdAt": "2026-08-23T10:00:00.000Z",
    "updatedAt": "2026-08-23T10:00:00.000Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

---

## Códigos de Respuesta

| Código | Descripción | Causa |
|--------|-------------|-------|
| `200` | OK | GET/PUT exitoso |
| `201` | Created | POST exitoso (creación) |
| `400` | Bad Request | Body JSON inválido, campos faltantes, validación Zod fallida |
| `401` | Unauthorized | Sin autenticación (sellerId no encontrado) |
| `404` | Not Found | Merchant no encontrado por ID |
| `405` | Method Not Allowed | Método HTTP no soportado |
| `500` | Internal Server Error | Error inesperado en el servidor |

---

## Códigos de Error por Campo

### Zod Validation Errors (400)

```json
{
  "success": false,
  "error": "Invalid document number for type ruc"
}
```

| Error | Descripción |
|-------|-------------|
| `Invalid JSON` | Body no es JSON válido |
| `Required` | Campo requerido faltante |
| `Invalid document number for type {type}` | RUC/DNI/CE no pasa validación |
| `String must contain at most 200 character(s)` | businessName excede 200 chars |
| `String must contain at most 300 character(s)` | address excede 300 chars |
| `Invalid email` | Email no tiene formato válido |
| `String must contain exactly 9 digit(s)` | Phone no tiene 9 dígitos |
| `Invalid enum value` | status o documentType no es válido |

### DynamoDB Errors (500)

| Error | Descripción |
|-------|-------------|
| `ResourceNotFoundException` | Tabla no existe en DynamoDB |
| `ProvisionedThroughputExceededException` | Límite de throughput alcanzado |
| `ValidationException` | Parámetros inválidos |

### SQS Errors (500)

| Error | Descripción |
|-------|-------------|
| `QueueDoesNotExist` | Cola SQS no existe |
| `InvalidSecurity` | Credenciales inválidas |

---

## Validación de Documentos

### RUC (11 dígitos)

- Algoritmo: Módulo 11
- Primer dígito: 10 (empresa privada) o 20 (empresa pública)
- Último dígito: dígito verificador

### DNI (8 dígitos)

- Validación básica: longitud exacta de 8 dígitos

### CE (12 dígitos)

- Validación básica: longitud exacta de 12 dígitos

---

## Testing Endpoints

### Health (sin auth)

```bash
curl http://localhost:3001/health
# → {"status":"healthy","service":"mini-onboarding-backend","timestamp":"..."}

curl http://localhost:3001/hello
# → {"message":"Hello from Mini Onboarding backend!","timestamp":"..."}
```

### Listar merchants (mock auth)

```bash
curl http://localhost:3001/merchants
# → {"success":true,"data":[{"id":"MERCHANT#test-ruc-001",...},...]}
```

### Obtener merchant por ID

```bash
# IMPORTANTE: El # debe codificarse como %23 en la URL
curl "http://localhost:3001/merchants/MERCHANT%23test-ruc-001"
# → {"success":true,"data":{"id":"MERCHANT#test-ruc-001",...}}

# Con document type DNI
curl "http://localhost:3001/merchants/MERCHANT%23test-dni-002"
# → {"success":true,"data":{"id":"MERCHANT#test-dni-002",...}}
```

### Crear merchant

```bash
# RUC válido
curl -X POST http://localhost:3001/merchants \
  -H "Content-Type: application/json" \
  -d '{"documentType":"ruc","documentNumber":"20123456786"}'
# → 201 {"success":true,"data":{"id":"MERCHANT#uuid",...}}

# DNI válido
curl -X POST http://localhost:3001/merchants \
  -H "Content-Type: application/json" \
  -d '{"documentType":"dni","documentNumber":"12345678"}'
# → 201 {"success":true,"data":{"id":"MERCHANT#uuid",...}}

# RUC inválido (falla validación)
curl -X POST http://localhost:3001/merchants \
  -H "Content-Type: application/json" \
  -d '{"documentType":"ruc","documentNumber":"12345678901"}'
# → 400 {"success":false,"error":"Invalid document number for type ruc"}

# Body inválido (JSON malformado)
curl -X POST http://localhost:3001/merchants \
  -H "Content-Type: application/json" \
  -d 'not-valid-json'
# → 400 {"success":false,"error":"Invalid JSON"}

# Campo faltante
curl -X POST http://localhost:3001/merchants \
  -H "Content-Type: application/json" \
  -d '{"documentType":"ruc"}'
# → 400 {"success":false,"error":"Required"}
```

### Actualizar merchant

```bash
# Cambiar estado a enriching
curl -X PUT "http://localhost:3001/merchants/MERCHANT%23test-ruc-001" \
  -H "Content-Type: application/json" \
  -d '{"status":"enriching"}'
# → 200 {"success":true,"data":{...,"status":"enriching",...}}

# Actualizar múltiples campos
curl -X PUT "http://localhost:3001/merchants/MERCHANT%23test-ruc-001" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Mi Empresa SAC","address":"Av. Lima 123","phone":"999888777"}'
# → 200 {"success":true,"data":{...,"businessName":"Mi Empresa SAC",...}}

# Phone inválido (no 9 dígitos)
curl -X PUT "http://localhost:3001/merchants/MERCHANT%23test-ruc-001" \
  -H "Content-Type: application/json" \
  -d '{"phone":"123"}'
# → 400 {"success":false,"error":"String must contain exactly 9 digit(s)"}

# Merchant no encontrado
curl -X PUT "http://localhost:3001/merchants/MERCHANT%23no-existe" \
  -H "Content-Type: application/json" \
  -d '{"status":"submitted"}'
# → 404 {"success":false,"error":"Merchant MERCHANT#no-existe not found"}
```

---

## Troubleshooting Endpoints

### 401 Unauthorized

```
{"success":false,"error":"Unauthorized"}
```

**Causa**: `AUTH_MOCK` no está configurado o es `false`.

**Solución**:
```bash
# Verificar .env
grep AUTH_MOCK .env
# Debe mostrar: AUTH_MOCK=true

# Reiniciar backend después de cambiar .env
docker compose up backend -d --build
```

### 404 Not Found (Merchant)

```
{"success":false,"error":"Merchant MERCHANT#xxx not found"}
```

**Causa**: El merchant no existe en DynamoDB.

**Solución**:
```bash
# Verificar datos en DynamoDB
make db-shell

# Si no hay datos, ejecutar seed
make db-seed
```

### 500 Internal Server Error

```
{"success":false,"error":"Internal server error"}
```

**Causas posibles**:
1. DynamoDB no está corriendo
2. Tabla no existe
3. SQS queue no existe

**Solución**:
```bash
# Verificar que FLOCI está saludable
make floci-health

# Recrear tabla + SQS queue
make db-setup

# Ver logs del backend
docker compose logs backend --tail 50
```

### Connection Refused

```
curl: (7) Failed to connect to localhost port 3001
```

**Causa**: Backend no está corriendo.

**Solución**:
```bash
# Verificar contenedores
docker compose ps

# Levantar backend
docker compose up backend -d

# Ver logs
docker compose logs backend
```

### URL encoding para IDs con #

El character `#` en los IDs debe codificarse como `%23` en URLs:

```bash
# ✅ Correcto
curl "http://localhost:3001/merchants/MERCHANT%23test-ruc-001"

# ❌ Incorrecto (el # se interpreta como fragmento)
curl "http://localhost:3001/merchants/MERCHANT#test-ruc-001"
```
