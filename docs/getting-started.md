# Getting Started

## Requisitos previos

- Docker Desktop (o Docker Engine + Compose v2)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Node.js 24+ (para desarrollo fuera de Docker)

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd applying

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar FLOCI (AWS local emulator)
make dev-floci

# 4. Verificar que FLOCI está saludable
make floci-health
```

## Estructura del proyecto

```
applying/
├── compose.yml              # Config base (producción)
├── compose.override.yml     # Overrides para desarrollo
├── .env.example             # Variables de entorno
├── Makefile                 # Comandos comunes
│
├── docker/
│   ├── Dockerfile.frontend  # Multi-stage: NextJS → Nginx
│   ├── Dockerfile.backend   # Multi-stage: Node.js → Lambda
│   ├── Dockerfile.infra     # Terraform + AWS CLI
│   └── nginx.conf           # Config Nginx para frontend
│
├── frontend/                # NextJS 15
├── backend/                 # Lambda handlers (Node.js)
├── infrastructure/          # Terraform modules
├── tests/                   # E2E tests
└── docs/                    # ADRs + documentación
```

## Comandos principales

```bash
# Ayuda
make help                   # Mostrar todos los comandos

# Desarrollo
make dev                    # Levantar todo (frontend + backend + floci)
make dev-frontend           # Solo frontend
make dev-backend            # Solo backend
make dev-floci              # Solo FLOCI

# Tests
make test                   # Todos los tests
make test-unit              # Solo unit tests
make test-integration       # Solo integration tests

# Infraestructura
make infra-init             # terraform init
make infra-plan             # terraform plan
make infra-apply            # terraform apply
make infra-destroy          # terraform destroy

# Utilidades
make logs                   # Ver logs de todos los servicios
make shell-frontend         # Shell en contenedor frontend
make shell-backend          # Shell en contenedor backend
make floci-health           # Verificar FLOCI saludable
make clean                  # Limpiar contenedores y volúmenes
```

## FLOCI (AWS Local Emulator)

FLOCI emula servicios de AWS localmente. Endpoint: `http://localhost:4566`

### Servicios disponibles

- DynamoDB
- SQS / SNS
- S3
- Lambda
- API Gateway v1/v2
- Cognito
- SES
- IAM
- CloudWatch
- X-Ray
- Y 47 servicios más

### Verificar servicios

```bash
# Health check general
curl http://localhost:4566/_localstack/health

# Listar buckets S3
aws --endpoint-url=http://localhost:4566 s3 ls

# Listar tablas DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
```

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `AWS_ENDPOINT_URL` | URL de FLOCI | `http://localhost:4566` |
| `AWS_REGION` | Región AWS | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Access key (fake para local) | `test` |
| `AWS_SECRET_ACCESS_KEY` | Secret key (fake para local) | `test` |
| `NEXT_PUBLIC_API_URL` | URL del API para el frontend | `http://localhost:4566` |
| `SES_SENDER_EMAIL` | Email remitente SES | `noreply@mini-onboarding.local` |
| `DYNAMODB_TABLE` | Nombre de la tabla DynamoDB | `merchants` |
| `AUTH_MOCK` | Mock auth para dev local | `true` |
| `COGNITO_USER_POOL_ID` | ID del User Pool Cognito | `us-east-1_11bb0fdf1` |
| `COGNITO_CLIENT_ID` | ID del App Client | `67e7f9268a5347ff88e18d23e4` |
| `COGNITO_REGION` | Región de Cognito | `us-east-1` |

---

## Autenticación (Cognito)

### Setup de Cognito en FLOCI

```bash
# Crear User Pool + App Client + Test User
make cognito-setup
```

Esto crea:
- **User Pool**: `mini-onboarding-sellers`
- **App Client**: `mini-onboarding-web`
- **Test User**: `seller@test.com`

### Credenciales de prueba

| Campo | Valor |
|-------|-------|
| **Email** | `seller@test.com` |
| **Password** | `Seller123!` |

### Login via API

```bash
# Obtener token de acceso
curl -X POST http://localhost:4566 \
  -H "Content-Type: application/x-amz-json-1.1" \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -d '{
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": "67e7f9268a5347ff88e18d23e4",
    "AuthParameters": {
      "USERNAME": "seller@test.com",
      "PASSWORD": "Seller123!"
    }
  }'
```

### Login via Frontend

1. Abrir `http://localhost:3000/login`
2. Ingresar email: `seller@test.com`
3. Ingresar password: `Seller123!`
4. Click "Entrar"
5. Redirige al Dashboard

### Flujo de autenticación

```
Frontend → Cognito (USER_PASSWORD_AUTH) → Tokens
    ↓
Frontend guarda tokens en localStorage
    ↓
Frontend envía Authorization: Bearer <token> al Backend
    ↓
Backend valida JWT contra Cognito JWKS
    ↓
Backend extrae sellerId del token (claims.sub)
    ↓
Backend retorna merchants del seller autenticado
```

---

## Testing API Endpoints

### Setup inicial

```bash
# 1. Levantar FLOCI
docker compose up floci -d

# 2. Crear tabla DynamoDB + SQS queue
make db-setup

# 3. Insertar datos de prueba
make db-seed

# 4. Levantar backend
docker compose up backend -d

# 5. Verificar que el backend está listo
docker compose logs backend --tail 5
```

### Health endpoints (sin auth)

```bash
# Health check
curl http://localhost:3001/health
# → {"status":"healthy","service":"mini-onboarding-backend","timestamp":"..."}

# Hello world
curl http://localhost:3001/hello
# → {"message":"Hello from Mini Onboarding backend!","timestamp":"..."}
```

### Merchants endpoints (con mock auth)

**Mock auth**: Cuando `AUTH_MOCK=true`, se usa `seller-dev-001` como sellerId.

```bash
# Listar merchants del seller mock
curl http://localhost:3001/merchants
# → {"success":true,"data":[...2 merchants...]}

# Obtener merchant por ID (importante: # → %23 en URL)
curl "http://localhost:3001/merchants/MERCHANT%23test-ruc-001"
# → {"success":true,"data":{"id":"MERCHANT#test-ruc-001",...}}

# Crear nuevo merchant
curl -X POST http://localhost:3001/merchants \
  -H "Content-Type: application/json" \
  -d '{"documentType":"ruc","documentNumber":"20123456786"}'
# → 201 {"success":true,"data":{"id":"MERCHANT#uuid",...}}

# Actualizar merchant
curl -X PUT "http://localhost:3001/merchants/MERCHANT%23test-ruc-001" \
  -H "Content-Type: application/json" \
  -d '{"status":"submitted"}'
# → 200 {"success":true,"data":{...,"status":"submitted",...}}
```

### Datos de prueba

| ID | Documento | Estado | Seller |
|----|-----------|--------|--------|
| `MERCHANT#test-ruc-001` | RUC 20123456786 | pending_enrichment | seller-dev-001 |
| `MERCHANT#test-dni-002` | DNI 12345678 | ready_to_submit | seller-dev-001 |
| `MERCHANT#test-ruc-003` | RUC 20987654321 | submitted | seller-dev-002 |

> Nota: Solo ves merchants de `seller-dev-001` porque el mock auth usa ese sellerId.

### Verificar datos en DynamoDB

```bash
# Scan completo
make db-shell

# Reset completo (borrar + recrear + seed)
make db-reset
```

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | AUTH_MOCK no está activo | Verificar `.env` y reiniciar backend |
| `404 Not Found` | Merchant no existe | Ejecutar `make db-seed` |
| `500 Internal Server Error` | DynamoDB/SQS no disponible | Verificar FLOCI con `make floci-health` |
| `Connection refused` | Backend no está corriendo | Ejecutar `docker compose up backend -d` |

Para más detalles, ver [Backend API Documentation](backend.md).

## Development workflow

### Agregar un nuevo feature

1. Crear rama: `git checkout -b feature/nombre`
2. Desarrollar en `frontend/` o `backend/`
3. Tests: `make test`
4. Commit con mensaje descriptivo
5. Push y PR

### Probar cambios en infraestructura

```bash
# Ver qué cambiaría
make infra-plan

# Aplicar cambios
make infra-apply

# Si algo falla, destruir y recrear
make infra-destroy
make infra-apply
```

## Troubleshooting

### FLOCI no arranca

```bash
# Ver logs
docker compose logs floci

# Reiniciar
make clean
make dev-floci
```

### Puerto 4566 en uso

```bash
# Matar proceso que usa el puerto
lsof -ti:4566 | xargs kill -9
```

### Limpiar todo

```bash
make clean                    # Contenedores + volúmenes
docker system prune -af       # Limpiar imágenes Docker
```
