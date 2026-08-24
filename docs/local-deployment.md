# Guía de Despliegue Local — Mini Onboarding

Guía completa paso a paso para levantar el proyecto en tu máquina usando Docker + FLOCI.

---

## Tabla de contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonar y configurar](#2-clonar-y-configurar)
3. [Levantar servicios](#3-levantar-servicios)
4. [Verificar que todo funciona](#4-verificar-que-todo-funciona)
5. [Usar la aplicación](#5-usar-la-aplicación)
6. [Comandos útiles](#6-comandos-útiles)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Requisitos previos

### Software necesario

| Software           | Versión mínima | Cómo verificar           | Cómo instalar                                     |
| ------------------ | -------------- | ------------------------ | ------------------------------------------------- |
| **Docker**         | 24.0+          | `docker --version`       | [docker.com](https://docs.docker.com/get-docker/) |
| **Docker Compose** | v2.20+         | `docker compose version` | Incluido con Docker Desktop                       |
| **Git**            | 2.30+          | `git --version`          | [git-scm.com](https://git-scm.com/)               |

### Hardware mínimo

| Recurso | Mínimo      | Recomendado |
| ------- | ----------- | ----------- |
| RAM     | 4 GB        | 8 GB        |
| Disco   | 5 GB libres | 10 GB       |
| CPU     | 2 cores     | 4 cores     |

### Puertos requeridos

| Puerto | Servicio             | Notas                       |
| ------ | -------------------- | --------------------------- |
| 3000   | Frontend (NextJS)    | Interfaz de usuario         |
| 3001   | Backend (Node.js)    | API server                  |
| 4566   | FLOCI (AWS emulator) | DynamoDB, SQS, Cognito, SES |

> **Importante**: Asegúrate de que estos puertos no estén en uso por otros servicios.

---

## 2. Clonar y configurar

### 2.1 Clonar el repositorio

```bash
git clone <repo-url>
cd applying
```

### 2.2 Crear archivo de variables de entorno

```bash
cp .env.example .env
```

### 2.3 Revisar el archivo `.env`

El archivo `.env` viene preconfigurado para desarrollo local. **No necesitas modificarlo** para empezar.

```bash
# Ver el contenido
cat .env
```

Variables principales:

| Variable                | Valor                           | Propósito                     |
| ----------------------- | ------------------------------- | ----------------------------- |
| `AWS_ENDPOINT_URL`      | `http://floci:4566`             | URL de FLOCI dentro de Docker |
| `AWS_REGION`            | `us-east-1`                     | Región de AWS                 |
| `AWS_ACCESS_KEY_ID`     | `test`                          | Credencial fake (FLOCI)       |
| `AWS_SECRET_ACCESS_KEY` | `test`                          | Credencial fake (FLOCI)       |
| `DYNAMODB_TABLE`        | `merchants`                     | Nombre de la tabla            |
| `AUTH_MOCK`             | `true`                          | Bypass JWT (solo dev)         |
| `SES_SENDER_EMAIL`      | `noreply@mini-onboarding.local` | Email de prueba               |

---

## 3. Levantar servicios

### 3.1 Setup completo (primera vez)

Este comando crea todo lo necesario en FLOCI: User Pool de Cognito, tabla DynamoDB, colas SQS y datos de prueba.

```bash
make setup
```

Salida esperada:

```
✅ Cognito User Pool created: us-east-1_XXXXXXXXX
✅ Cognito Client created: XXXXXXXXXXXXXXXXXXXXXXXX
✅ Test user created: seller@test.com
✅ DynamoDB table created: merchants
✅ SQS queue created: merchants-enrichment
✅ DynamoDB SQS queue created: merchants-enrichment
✅ Seed data inserted: 3 merchants
```

> **Tiempo estimado**: 10-30 segundos

### 3.2 Levantar todos los servicios

```bash
docker compose up
```

O en background (detached mode):

```bash
docker compose up -d
```

### 3.3 Servicios que se levantan

| Servicio   | Puerto | Descripción                                  |
| ---------- | ------ | -------------------------------------------- |
| `floci`    | 4566   | Emulador AWS (DynamoDB, SQS, Cognito, SES)   |
| `backend`  | 3001   | API server (Node.js + TypeScript)            |
| `frontend` | 3000   | Interfaz de usuario (NextJS)                 |
| `worker`   | —      | Procesador de mensajes SQS (polling cada 2s) |

### 3.4 Verificar que FLOCI está saludable

```bash
make floci-health
```

Salida esperada:

```json
{
  "services": {
    "dynamodb": "running",
    "sqs": "running",
    "cognito-idp": "running",
    "ses": "running"
  }
}
```

---

## 4. Verificar que todo funciona

### 4.1 Health checks

```bash
# Backend
curl http://localhost:3001/health
# → {"status":"healthy","service":"mini-onboarding-backend","timestamp":"..."}

# Hello
curl http://localhost:3001/hello
# → {"message":"Hello from Mini Onboarding backend!","timestamp":"..."}
```

### 4.2 Verificar DynamoDB

```bash
# Listar tablas
docker compose run --rm awscli dynamodb list-tables \
  --endpoint-url http://floci:4566 \
  --region us-east-1

# Ver merchants (scan)
make db-shell
```

### 4.3 Verificar Cognito

```bash
# Login directo (curl)
curl -X POST http://localhost:4566 \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": "'"$(grep COGNITO_CLIENT_ID .env | cut -d= -f2)"'",
    "AuthParameters": {
      "USERNAME": "seller@test.com",
      "PASSWORD": "Seller123!"
    }
  }'
```

### 4.4 Verificar API endpoints

```bash
# Listar merchants (mock auth: seller-dev-001)
curl http://localhost:3001/merchants

# Obtener merchant específico
curl "http://localhost:3001/merchants/MERCHANT%23test-ruc-001"

# Crear nuevo merchant
curl -X POST http://localhost:3001/merchants \
  -H "Content-Type: application/json" \
  -d '{"documentType":"ruc","documentNumber":"20123456786"}'
```

### 4.5 Verificar Frontend

Abrir en el navegador: **http://localhost:3000**

---

## 5. Usar la aplicación

### 5.1 Login

1. Ir a **http://localhost:3000/login**
2. Ingresar credenciales:

| Campo    | Valor             |
| -------- | ----------------- |
| Email    | `seller@test.com` |
| Password | `Seller123!`      |

3. Click **"Entrar"**
4. Redirige al **Dashboard**

### 5.2 Dashboard

El dashboard muestra la lista de merchants del seller autenticado.

- **Auto-polling**: Se actualiza cada 10 segundos si hay merchants con estado pendiente
- **Crear merchant**: Click en "Crear Merchant"
- **Ver detalle**: Click en "Ver" de cualquier merchant

### 5.3 Crear un merchant

1. Ir a **http://localhost:3000/merchants/new**
2. Seleccionar tipo de documento (RUC, DNI, CE)
3. Ingresar número de documento
4. Click **"Crear"**

El merchant se crea con estado `pending_enrichment`. El worker SQS procesa el enriquecimiento automáticamente (1-5 segundos).

### 5.4 Verificar enriquecimiento

```bash
# Ver el merchant creado
curl "http://localhost:3001/merchants/MERCHANT%23<document-number>"

# El estado debería cambiar a:
# "pending_enrichment" → "ready_to_submit"
```

### 5.5 Flujo completo

```
1. Login → Cognito autentica → Tokens
2. Dashboard → GET /merchants → Lista merchants
3. Crear → POST /merchants → Merchant creado (pending_enrichment)
4. Worker → SQS → Enricher → SUNAT Mock → DynamoDB update
5. Dashboard → Auto-poll → Merchant aparece como ready_to_submit
6. Confirmar → PUT /merchants/:id → Merchant submitted
```

---

## 6. Comandos útiles

### Desarrollo

```bash
make dev                # Levantar todo
make dev-frontend       # Solo frontend
make dev-backend        # Solo backend
make dev-floci          # Solo FLOCI
```

### Tests

```bash
make test               # Todos los tests (105)
make test-unit          # Unit tests (84)
make test-frontend      # Frontend tests (10)
make test-integration   # Integration tests (11, requiere backend corriendo)
```

### Base de datos

```bash
make db-setup           # Crear tabla + SQS en FLOCI
make db-seed            # Insertar datos de prueba
make db-shell           # Ver merchants (scan)
make db-reset           # Eliminar y recrear tabla (borra datos)
make cognito-setup      # Recrear User Pool + Client + User
make setup              # Setup completo (Cognito + DynamoDB + SQS + seed)
```

### Infraestructura (AWS)

```bash
make build-lambda       # Build ZIPs para Lambda (esbuild)
make build-frontend     # Build frontend estático
make infra-init         # terraform init
make infra-plan         # terraform plan
make infra-apply        # terraform apply
make deploy-frontend    # S3 sync + CloudFront invalidation
```

### Utilidades

```bash
make logs               # Ver logs de todos los servicios
make shell-frontend     # Shell en contenedor frontend
make shell-backend      # Shell en contenedor backend
make floci-health       # Verificar FLOCI saludable
make clean              # Limpiar contenedores y volúmenes
```

---

## 7. Troubleshooting

### FLOCI no arranca

**Síntoma**: `docker compose logs floci` muestra errores

**Solución**:

```bash
make clean              # Limpiar todo
make dev-floci          # Recrear FLOCI
make floci-health       # Verificar salud
```

### DynamoDB no existe la tabla

**Síntoma**: `500 Internal Server Error` al llamar API

**Solución**:

```bash
make db-setup           # Crear tabla
make db-seed            # Insertar datos
```

### Puerto en uso

**Síntoma**: `Error starting userland proxy: Bind for 0.0.0.0:3000: address already in use`

**Solución**:

```bash
# Matar proceso que usa el puerto
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:4566 | xargs kill -9
```

### Client ID de Cognito desactualizado

**Síntoma**: `Client not found` al hacer login

**Solución**:

```bash
make cognito-setup      # Recrear Cognito (auto-actualiza .env)
docker compose restart  # Reiniciar backend con nuevo Client ID
```

### DynamoDB no persiste después de restart

**Síntoma**: `TableNames: []` después de `docker compose restart`

**Solución**:

```bash
make setup              # Recrear todo (idempotente)
```

### SQS Worker no procesa mensajes

**Síntoma**: Merchant se queda en `pending_enrichment`

**Solución**:

```bash
# Ver logs del worker
docker compose logs worker --tail 50

# Verificar que SQS tiene mensajes
docker compose run --rm awscli sqs get-queue-attributes \
  --queue-url http://floci:4566/000000000000/merchants-enrichment \
  --attribute-names ApproximateNumberOfMessages \
  --endpoint-url http://floci:4566
```

### Limpiar todo y empezar de cero

```bash
make clean              # Eliminar contenedores + volúmenes
make setup              # Recrear todo
docker compose up       # Levantar servicios
```

---

## Arquitectura local

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                       │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐ │
│  │ Frontend │   │ Backend  │   │  Worker  │   │  FLOCI  │ │
│  │  :3000   │   │  :3001   │   │          │   │  :4566  │ │
│  │ NextJS   │   │ Node.js  │   │ SQS      │   │ AWS     │ │
│  │ Dev Svr  │   │ Dev Svr  │   │ Polling  │   │ Emulator│ │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬────┘ │
│       │              │              │              │       │
│       │    ┌─────────┴──────────────┴──────────────┘       │
│       │    │                                                │
│       │    │  ┌─────────────────────────────────────────┐  │
│       │    │  │            FLOCI Services               │  │
│       │    │  │                                         │  │
│       │    │  │  ┌──────────┐  ┌──────────┐  ┌───────┐ │  │
│       │    └──│──│ DynamoDB │  │   SQS    │  │Cognito│ │  │
│       │       │  │          │  │          │  │       │ │  │
│       │       │  └──────────┘  └──────────┘  └───────┘ │  │
│       │       │                                         │  │
│       │       │  ┌──────────┐                           │  │
│       │       └──│   SES    │                           │  │
│       │          │  (mock)  │                           │  │
│       │          └──────────┘                           │  │
│       │                                                  │  │
│       │          └──────────────────────────────────────┘  │
│       │                                                    │
└───────┴────────────────────────────────────────────────────┘
        │
        │
   ┌────┴────┐
   │ Browser │
   │ :3000   │
   └─────────┘
```

### Flujo de datos

```
Browser → localhost:3000 (Frontend)
  ├── /api/auth → FLOCI Cognito (proxy, server-side)
  ├── /api/merchants → Backend :3001 (proxy, server-side)
  └── /api/merchants/[id] → Backend :3001 (proxy, server-side)

Backend → FLOCI
  ├── PUT/GET merchants → DynamoDB
  ├── SQS sendMessage → SQS Queue

Worker → SQS (polling cada 2s)
  ├── SQS receiveMessage
  ├── GET merchant → DynamoDB
  ├── SUNAT Mock → Datos enriquecidos
  ├── PUT merchant → DynamoDB (status: ready_to_submit)
  └── SES sendEmail → Email (mock)
```

---

## Notas importantes

1. **AUTH_MOCK=true**: En local, no se valida JWT real. Se usa `seller-dev-001` como sellerId.

2. **SQS en memory mode**: Los mensajes se pierden al reiniciar FLOCI. No importa porque el worker los procesa rápido.

3. **DynamoDB persiste**: La tabla sobrevive reinicios gracias a `FLOCI_STORAGE_MODE=persistent`.

4. **Cognito persiste**: User Pool y Client sobreviven reinicios.

5. **FLOCI corrupt files**: A veces genera `dynamodb-tables.json.corrupt`. Se arregla con `make setup`.

6. **URL encoding**: Los merchant IDs contienen `#`. En URLs se usa `%23`.

7. **Auto-polling**: El dashboard se actualiza cada 10 segundos si hay merchants pendientes.

---

## Siguientes pasos

Una vez que la aplicación funcione en local:

1. [Guía de Deploy AWS](production-checklist.md) — Cómo subir a AWS real
2. [Architecture](architecture.md) — Diagrama de arquitectura completo
3. [Backend API](backend.md) — Documentación de endpoints
