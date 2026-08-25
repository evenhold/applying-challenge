# Mini Onboarding — Plataforma de Afiliación de Comercios

Aplicación web sobre AWS para el onboarding de nuevos comercios (estilo Culqi).

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | NextJS 15 (estático) |
| Backend | Node.js 24 + Lambda |
| DB | DynamoDB |
| Async | SQS + DLQ |
| Auth | Cognito |
| Local Dev | FLOCI (AWS emulator) |
| IaC | Terraform |
| Tests | Vitest |
| PM | pnpm |

## Inicio rápido

```bash
# 1. Clonar y configurar
git clone <repo-url> && cd applying
cp .env.example .env

# 2. Levantar FLOCI (AWS local emulator)
make dev-floci

# 3. Verificar salud
make floci-health
```

## Comandos

```bash
make help              # Ver todos los comandos
make dev               # Levantar todo
make test              # Ejecutar tests
make infra-plan        # Ver cambios Terraform
make clean             # Limpiar todo
```

## Documentación

| Documento | Descripción |
|---|---|
| [Local Deployment](docs/local-deployment.md) | Guía completa de despliegue local |
| [Getting Started](docs/getting-started.md) | Inicio rápido y desarrollo |
| [Architecture](docs/architecture.md) | Diagrama de arquitectura |
| [OWASP Top 10 Compliance](docs/owasp-top10-compliance.md) | Evaluación de cumplimiento OWASP |
| [AWS Costs & Resources](docs/aws-costs-and-resources.md) | Costos y recursos AWS desplegados |
| [Production Checklist](docs/production-checklist.md) | Checklist para deploy a AWS |
| [ADRs](docs/ADR/) | Architecture Decision Records |
| [AI Usage](docs/ai-usage.md) | Nota de uso de IA |
| [Challenge](CHALLENGE.md) | Requisitos del evaluation |
| [Overview](PROJECT_OVERVIEW.md) | Overview del proyecto |
