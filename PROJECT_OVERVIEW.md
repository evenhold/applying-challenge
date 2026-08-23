# Mini Onboarding

Plataforma para afiliar nuevos comercios (merchants) a una pasarela de pagos, estilo Culqi.

> **Arquitectura 100% Serverless** — Zero ops, pago por uso, ~$18/mes en AWS.

## Objetivo

Permitir a un seller (vendedor) registrar un comercio ingresando su RUC peruano. El sistema valida el RUC, enriquece los datos de forma asíncrona (razón social, dirección), y el seller confirma la afiliación.

## Flujo Principal

```
1. Seller inicia sesión (Cognito)
2. Ingresa RUC del comercio
3. Sistema valida RUC (módulo 11) → sync
4. Datos se enriquecen vía SQS → Lambda → SUNAT → DynamoDB
5. Seller ve datos enriquecidos, confirma
6. Merchant queda en estado "submitted"
```

## Stack Tecnológico

| Capa | Servicio | Justificación |
|------|----------|---------------|
| Frontend | NextJS 16 → S3 + CloudFront | Estático, bajo costo |
| API | API Gateway v2 + Lambda (Node.js 24) | Serverless, auto-scales |
| Auth | Cognito User Pools | JWT nativo, MFA |
| DB | DynamoDB (single-table) | NoSQL, escalable, GSIs |
| Async | SQS + Lambda Enricher | Desacoplamiento, reintentos |
| Email | SES | Barato, nativo AWS |
| Local | FLOCI | Emulador AWS, siempre free |
| IaC | Terraform | State management, módulos |
| Security | WAF + Cognito + IAM | OWASP Top 10 |
| Observability | CloudWatch + X-Ray | Logs, métricas, tracing |

## Documentación

- [Arquitectura](docs/architecture.md) — Diagrama y explicación del sistema
- [DynamoDB Design](docs/dynamodb-design.md) — Tabla, GSIs y access patterns
- [Seguridad](docs/security.md) — OWASP Top 10 mapping
- [Observabilidad](docs/observability.md) — Logs, métricas, alarmas, SLOs
- [Resiliencia](docs/resilience.md) — DLQ, reintentos, idempotencia
- [Costos](docs/cost-estimation.md) — Estimación mensual AWS

### Architecture Decision Records

- [ADR-001: Dominio](docs/adr/001-domain-choice.md) — Mini Onboarding con RUC
- [ADR-002: Frontend](docs/adr/002-frontend-framework.md) — NextJS sobre Angular
- [ADR-003: Async](docs/adr/003-async-processing.md) — SQS para enrichment
- [ADR-004: Auth](docs/adr/004-auth.md) — Cognito User Pools
- [ADR-005: Local Dev](docs/adr/005-local-dev.md) — FLOCI sobre LocalStack
- [ADR-006: Email](docs/adr/006-email-service.md) — SES sobre SNS
- [ADR-007: Serverless](docs/adr/007-serverless-architecture.md) — 100% serverless vs EC2/RDS

## Desarrollo Local

```bash
docker compose up -d     # Levantar frontend + backend + FLOCI
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# FLOCI:    http://localhost:4566
```

## Comandos Útiles

```bash
# Frontend
cd frontend && pnpm lint && pnpm test && pnpm build

# Backend
cd backend && pnpm lint && pnpm test && pnpm build

# Docker
docker compose up -d --build
docker compose logs -f backend
docker compose ps
```

## Evaluación

- **Sesión**: 45-60 minutos
- **Formato**: Presentación del diseño (~15 min) + preguntas
- **Entregables**: Diagrama, ADRs, código relevante, nota de uso de IA
