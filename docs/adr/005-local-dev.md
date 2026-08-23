# ADR-005: Desarrollo Local — FLOCI

## Estado

Aprobado

## Contexto

Necesitamos emular servicios AWS localmente para desarrollo. El stack incluye DynamoDB, SQS, SES, Cognito, API Gateway — todos servicios AWS.

## Decisión

**FLOCI** (AWS Local Emulator) como emulador AWS local.

### Configuración

```yaml
# compose.yml
floci:
  image: floci/floci:latest
  ports:
    - "4566:4566"
  environment:
    - FLOCI_DEFAULT_REGION=us-east-1
  healthcheck:
    test: ["CMD", "curl", "-sf", "http://localhost:4566/_localstack/health"]
```

### Servicios emulados

- DynamoDB (tablas, GSIs, queries)
- SQS (colas, DLQ, poll)
- SES (envío de emails — simulation mode)
- S3 (archivos)
- Cognito (user pools — básico)
- Lambda (si se necesita invocación local)

### Variables de entorno

```env
AWS_ENDPOINT_URL=http://floci:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

## Alternativas evaluadas

| Herramienta    | Pros                                             | Contras                          | Decisión    |
| -------------- | ------------------------------------------------ | -------------------------------- | ----------- |
| FLOCI          | 24ms startup, 13 MiB, 47 servicios, siempre free | Relativamente nuevo (2025)       | **Elegido** |
| LocalStack     | Maduro, bien documentado                         | Sunset marzo 2026, lento, pesado | No          |
| SAM local      | AWS oficial, Lambda simulation                   | Solo Lambda, no DynamoDB/SQS     | No          |
| DynamoDB Local | oficial para DynamoDB                            | Solo DynamoDB, no SQS/SES        | No          |
| Moto (Python)  | Buenos mocks                                     | Python, no Node.js friendly      | No          |

## Consecuencias

- FLOCI arranca en 24ms vs LocalStack ~30s
- Siempre free tier — sin costo de desarrollo
- Compatible con AWS SDK v3 (mismo endpoint, mismas credenciales)
- El healthcheck confirma que todos los servicios están listos antes de arrancar dependencias
