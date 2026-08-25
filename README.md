# Mini Onboarding — Plataforma de Afiliación de Comercios

Aplicación serverless en AWS para onboarding de comercios (estilo Culqi).

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                │
│                                                                 │
│  ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌───────────┐  │
│  │ S3 +     │───▶│ API GW  │───▶│ Lambda   │───▶│ DynamoDB  │  │
│  │CloudFront│    │ HTTP v2 │    │ merchants│    │ merchants │  │
│  │  (SPA)   │    │         │    │          │    │   table   │  │
│  └──────────┘    └────┬────┘    └────┬─────┘    └───────────┘  │
│                       │              │                          │
│                  JWT Authorizer      │ SQS                      │
│                       │              ▼                          │
│                  ┌────┴────┐    ┌──────────┐    ┌───────────┐  │
│                  │ Cognito │    │ enricher │───▶│ SES       │  │
│                  │ UserPool│    │ Lambda   │    │ (email)   │  │
│                  └─────────┘    └──────────┘    └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | NextJS 16 SPA (S3 + CloudFront) |
| Backend | Node.js 22 + Lambda + API Gateway v2 |
| DB | DynamoDB (on-demand, single-table + 2 GSIs) |
| Async | SQS → Lambda enricher → SES email |
| Auth | Cognito User Pool + JWT Authorizer |
| IaC | Terraform (10 módulos, 43 recursos) |
| Observability | CloudWatch Logs + Metrics + Alarms + X-Ray |
| Tests | Vitest (84 unit + 11 integration) |
| PM | pnpm |

## Cómo funciona

### 1. Frontend (SPA)

- **NextJS 16** exportado como estático (`output: 'export'`) → subido a **S3**
- **CloudFront** sirve los archivos con SPA error responses (200 en todas las rutas)
- Un solo archivo `page.tsx` con `useState` para navegar entre vistas (sin router)
- Cognito User Pool maneja login/registro
- JWT token se envía en header `Authorization: Bearer <token>`

### 2. Backend (Lambda + API Gateway)

- **API Gateway v2 HTTP** con 6 rutas:
  - `GET /health` — sin auth
  - `POST /merchants` — crear
  - `GET /merchants` — listar
  - `GET /merchants/{id}` — detalle
  - `PUT /merchants/{id}` — actualizar
  - `DELETE /merchants/{id}` — eliminar
- **JWT Authorizer** valida tokens de Cognito
- **Lambda merchants** (128MB) procesa CRUD con DynamoDB
- **Lambda enricher** (256MB) procesa mensajes SQS

### 3. Flujo de onboarding

```
1. Seller se registra/inicia sesión en Cognito
2. Crea merchant con RUC/DNI/CE
3. Lambda merchants guarda en DynamoDB + envía a SQS
4. Enricher Lambda procesa:
   - Consulta SUNAT Mock (simulación)
   - Actualiza datos en DynamoDB
   - Envía email de confirmación vía SES
5. Dashboard hace polling cada 3s hasta que merchant esté listo
6. Seller confirma envío → merchant en estado "submitted"
```

### 4. Seguridad

- **OWASP Top 10**: 10/10 cubiertos (9 por arquitectura, 1 parcial sin WAF)
- **CORS**: configurado para localhost (LOCAL) y CloudFront (PROD)
- **CSP headers**: via CloudFront Response Headers Policy
- **Secrets**: nunca versionados (`.gitignore` para `.env.*`)
- **IAM**: least-privilege (solo permisos necesarios por Lambda)

### 5. Local vs Producción

| Aspecto | Local | Producción |
|---------|-------|------------|
| API | FLOCI (LocalStack) | API Gateway real |
| Auth | Mock (`AUTH_MOCK=true`) | Cognito real |
| DB | DynamoDB Local | DynamoDB real |
| Queue | SQS Local | SQS real |
| Email | Console log | SES real |
| Build | `make dev` | `make deploy-aws` |

## Inicio rápido

### Local

```bash
make dev               # Levantar todo (FLOCI + backend + frontend)
make test              # Ejecutar tests
make logs-merchants    # Ver logs merchants (tiempo real)
```

### AWS

```bash
make infra-init        # Terraform init
make infra-apply       # Terraform apply (deploy infrastructure)
make build-frontend    # Build + subir a S3 + invalidar CloudFront
```

## Comandos

```bash
make help              # Ver todos los comandos
make dev               # Levantar todo (local)
make test              # Ejecutar tests
make infra-plan        # Ver cambios Terraform
make logs-merchants    # Logs merchants Lambda (tiempo real)
make logs-enricher     # Logs enricher Lambda (tiempo real)
make logs-apigw        # Access logs API Gateway (tiempo real)
make logs-all          # Todos los Lambda juntos
make sqs-status        # Estado cola SQS
make alarm-status      # Estado alarmas CloudWatch
make clean             # Limpiar todo
```

## Documentación

| Documento | Descripción |
|---|---|
| [Local Deployment](docs/local-deployment.md) | Guía completa de despliegue local |
| [Architecture](docs/architecture.md) | Diagrama de arquitectura |
| [OWASP Top 10 Compliance](docs/owasp-top10-compliance.md) | Evaluación de cumplimiento OWASP |
| [AWS Costs & Resources](docs/aws-costs-and-resources.md) | Costos y recursos AWS desplegados |
| [AWS Observability Commands](docs/aws-observability-commands.md) | Comandos para logs, traces, métricas |
| [Production Checklist](docs/production-checklist.md) | Checklist para deploy a AWS |
| [ADRs](docs/adr/) | Architecture Decision Records |
| [Challenge](CHALLENGE.md) | Requisitos del evaluation |
| [Overview](PROJECT_OVERVIEW.md) | Overview del proyecto |
