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
