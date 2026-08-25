# Costos y Recursos AWS

Mini Onboarding — Inventario de recursos y análisis de costos

---

## Recursos desplegados

### Conteo por servicio

| # | Servicio | Recursos | IDs/Names |
|---|----------|----------|-----------|
| 1 | Lambda | 2 functions + 1 event source mapping | `mini-onboarding-dev-merchants`, `mini-onboarding-dev-enricher` |
| 2 | API Gateway | 1 API + 1 authorizer + 6 routes + 1 stage | `qiq4nwptz1` |
| 3 | DynamoDB | 1 table + 2 GSIs | `mini-onboarding-dev-merchants` |
| 4 | SQS | 1 queue + 1 DLQ | `mini-onboarding-dev-enrichment` |
| 5 | Cognito | 1 User Pool + 1 Client + 1 Domain | `us-east-1_S33rLXlec` |
| 6 | SES | 1 identity + 1 config set + 1 event destination | `noreply@mini-onboarding.dev` |
| 7 | S3 | 1 bucket + versioning + encryption + policy | `mini-onboarding-frontend-dev` |
| 8 | CloudFront | 1 distribution + 1 OAC + 1 response headers policy | `d1vazin5v6ecqg.cloudfront.net` |
| 9 | IAM | 2 roles + 2 policies + 2 attachments | `lambda-merchants`, `lambda-enricher` |
| 10 | CloudWatch | 2 log groups + 1 alarm + 1 dashboard | `mini-onboarding-dev-*` |
| 11 | X-Ray | Tracing active en ambas Lambdas | — |

### Total: 11 servicios AWS, ~43 recursos Terraform

---

## Costos mensuales

### Desglose por servicio

| # | Servicio | Recurso | Costo/mes | Notas |
|---|----------|---------|-----------|-------|
| 1 | **Lambda** | merchants (128MB, 10s timeout) | $0.40 | 1M requests free tier |
| 2 | **Lambda** | enricher (256MB, 60s timeout) | $0.40 | SQS batch processing |
| 3 | **DynamoDB** | tabla + 2 GSIs (on-demand) | $0.00 | 25 WCU + 25 RCU free tier |
| 4 | **API Gateway** | HTTP API v2 | $0.00 | 1M requests free tier (12 meses) |
| 5 | **SQS** | enrichment queue + DLQ | $0.00 | 1M requests free tier |
| 6 | **Cognito** | User Pool (100 MAU) | $0.00 | 50K MAU free tier |
| 7 | **SES** | Email (sandbox, 0 emails) | $0.00 | 62K emails free tier (sandbox) |
| 8 | **S3** | Frontend bucket (0.6MB) | $0.00 | 5GB free tier |
| 9 | **CloudFront** | CDN (0GB transfer) | $0.00 | 1TB free tier (12 meses) |
| 10 | **X-Ray** | Tracing (0 traces) | $0.00 | 100K traces free tier |
| 11 | **CloudWatch** | Logs (0MB) + 1 alarm + dashboard | $0.00 | 5GB logs free tier |

### Total

```
┌─────────────────────────────────────────────────────┐
│  COSTO MENSUAL ACTUAL (con Free Tier)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CON Free Tier (primeros 12 meses):    $0.00/mes    │
│                                                     │
│  SIN Free Tier (después de 12 meses):  ~$1.63/mes  │
│                                                     │
│  CON WAF (opcional):                   +$8.00/mes   │
│  TOTAL sin WAF:                        ~$1.63/mes   │
│  TOTAL con WAF:                        ~$9.63/mes   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Nota sobre Free Tier

AWS Free Tier incluye 12 meses de:
- Lambda: 1M requests + 400K GB-seconds/mes
- DynamoDB: 25 WCU + 25 RCU
- API Gateway: 1M requests/mes
- SQS: 1M requests/mes
- Cognito: 50K MAU
- SES: 62K emails/mes (sandbox: ilimitado)
- S3: 5GB storage + 20K GET + 2K PUT
- CloudFront: 1TB transfer + 10M requests/mes
- X-Ray: 100K traces recorded + 1M traced requests

### Escalabilidad

| Tráfico mensual | Costo sin Free Tier | Costo con WAF |
|-----------------|--------------------|--------------|
| 0 requests (actual) | $0.00 | $8.00 |
| 10K requests | $0.05 | $8.05 |
| 100K requests | $0.50 | $8.50 |
| 1M requests | $5.00 | $13.00 |
| 10M requests | $45.00 | $53.00 |

---

## Recursos Terraform por módulo

### Módulo: Cognito (3 recursos)

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| `aws_cognito_user_pool` | merchants-sellers | Almacena usuarios del seller portal |
| `aws_cognito_user_pool_client` | merchants-sellers-app | Client ID para autenticación |
| `aws_cognito_user_pool_domain` | mini-onboarding-* | Hosted UI domain |

### Módulo: DynamoDB (1 recurso + 2 GSIs)

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| `aws_dynamodb_table` | merchants | Tabla principal con PK/SK |
| GSI1 | index | Query por sellerId |
| GSI2 | index | Query por status |

### Módulo: SQS (2 colas)

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| `aws_sqs_queue` | enrichment | Cola de mensajes para enriquecimiento |
| `aws_sqs_queue` | enrichment-dlq | Dead letter queue |

### Módulo: IAM (4 recursos)

| Recurso | Nombre | Permisos |
|---------|--------|----------|
| `aws_iam_role` | lambda-merchants | DynamoDB CRUD + SQS send + X-Ray |
| `aws_iam_role` | lambda-enricher | DynamoDB read/update + SQS receive + SES send + X-Ray |
| `aws_iam_role_policy` | merchants permissions | Least-privilege inline policy |
| `aws_iam_role_policy` | enricher permissions | Least-privilege inline policy |

### Módulo: Lambda (4 recursos)

| Recurso | Config | Propósito |
|---------|--------|-----------|
| `aws_lambda_function` | merchants (128MB, 10s, node22.x) | CRUD merchants |
| `aws_lambda_function` | enricher (256MB, 60s, node22.x) | SQS batch processor |
| `aws_lambda_permission` | api_gateway → merchants | API GW invoke |
| `aws_lambda_event_source_mapping` | SQS → enricher | Auto-process messages |

### Módulo: API Gateway (7 recursos)

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| `aws_apigatewayv2_api` | main | HTTP API v2 |
| `aws_apigatewayv2_authorizer` | cognito | JWT validation |
| `aws_apigatewayv2_stage` | default | Deployment stage |
| `aws_apigatewayv2_integration` | merchants | Lambda proxy |
| `aws_apigatewayv2_route` | POST /merchants | Create (JWT) |
| `aws_apigatewayv2_route` | GET /merchants | List (JWT) |
| `aws_apigatewayv2_route` | GET /merchants/{id} | Detail (JWT) |
| `aws_apigatewayv2_route` | PUT /merchants/{id} | Update (JWT) |
| `aws_apigatewayv2_route` | DELETE /merchants/{id} | Delete (JWT) |
| `aws_apigatewayv2_route` | GET /health | Health check (no auth) |

### Módulo: S3 + CloudFront (7 recursos)

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| `aws_s3_bucket` | frontend | Static files |
| `aws_s3_bucket_versioning` | — | Version control |
| `aws_s3_bucket_server_side_encryption_configuration` | — | AES256 |
| `aws_s3_bucket_public_access_block` | — | Block all public |
| `aws_s3_bucket_policy` | — | CloudFront OAC |
| `aws_cloudfront_origin_access_control` | — | Secure S3 access |
| `aws_cloudfront_distribution` | — | CDN + SPA routing |
| `aws_cloudfront_response_headers_policy` | security-headers | CSP + HSTS + X-Frame |

### Módulo: SES (3 recursos)

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| `aws_ses_email_identity` | sender | Email verification |
| `aws_ses_configuration_set` | tracking | Email tracking |
| `aws_ses_event_destination` | cloudwatch | Bounce/complaint logging |

### Módulo: Observability (4 recursos)

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| `aws_cloudwatch_log_group` | merchants Lambda | Logs (7 días) |
| `aws_cloudwatch_log_group` | enricher Lambda | Logs (7 días) |
| `aws_cloudwatch_metric_alarm` | enricher-errors | Alerta si >5 errores/5min |
| `aws_cloudwatch_dashboard` | main | Métricas Lambda |

---

## Endpoints de la API

| Método | Ruta | Auth | Lambda | Descripción |
|--------|------|------|--------|-------------|
| GET | `/health` | No | merchants | Health check |
| POST | `/merchants` | JWT | merchants | Crear merchant |
| GET | `/merchants` | JWT | merchants | Listar merchants por seller |
| GET | `/merchants/{id}` | JWT | merchants | Detalle de merchant |
| PUT | `/merchants/{id}` | JWT | merchants | Actualizar merchant |
| DELETE | `/merchants/{id}` | JWT | merchants | Eliminar merchant |

### URLs de producción

| Servicio | URL |
|----------|-----|
| **Frontend** | https://d1vazin5v6ecqg.cloudfront.net |
| **API** | https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com |
| **Health** | https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com/health |

### Credenciales de prueba

| Campo | Valor |
|-------|-------|
| Email | `seller@test.com` |
| Password | `Seller123!` |
| User Pool | `us-east-1_S33rLXlec` |
| Client ID | `4o7vqppl5rh1vre3cppd4ke81s` |
| Account ID | `459321894062` |

---

## Comandos de gestión

```bash
# Deploy completo
make build-lambda     # Build Lambda ZIPs
make infra-apply      # Deploy infraestructura
make build-frontend   # Build + deploy frontend

# Verificar
make infra-plan       # Ver cambios pendientes
aws logs tail /aws/lambda/mini-onboarding-dev-merchants --since 1h

# Destruir todo
make infra-destroy    # Eliminar TODOS los recursos AWS
```

---

## Factores de costo

| Factor | Impacto | Control |
|--------|---------|---------|
| Requests a Lambda | +$0.20/millón | Auto-scaling (sin límite) |
| DynamoDB reads | +$0.25/millón RCU | On-demand (se adapta) |
| DynamoDB writes | +$0.62/millón WCU | On-demand (se adapta) |
| API Gateway requests | +$1.00/millón | Auto-scaling |
| CloudFront transfer | +$0.085/GB | PriceClass_100 |
| Cognito MAU | +$0.005/MAU después de 50K | Auto-scaling |
| WAF | +$5.00/WAF + $1.00/regla + $0.60/millón | Fijo + variable |
| SES | +$0.10/mil emails | Solo envíos |
| X-Ray | +$0.50/millón traces | Sampling 5% |
| CloudWatch logs | +$0.50/GB ingestion | Retención 7 días |
