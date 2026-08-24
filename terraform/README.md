# Terraform — Mini Onboarding Infrastructure

Infraestructura como código del proyecto Mini Onboarding. Despliega los recursos AWS necesarios para el backend serverless completo: autenticación, compute, API, base de datos, colas, frontend, email, seguridad y observabilidad.

## Arquitectura

Cada entorno despliega los siguientes módulos AWS:

| Módulo | Servicios | Propósito |
|--------|-----------|-----------|
| Cognito | User Pool + Client | Autenticación de sellers (JWT, OAuth) |
| DynamoDB | Merchants Table + 2 GSIs | Base de datos single-table |
| SQS | Enrichment Queue + DLQ | Cola para enriquecimiento asíncrono |
| Lambda | createMerchant + enricher | Compute serverless (Node.js 24) |
| API Gateway | HTTP API v2 + Cognito Authorizer | REST API con JWT validation en edge |
| S3 + CloudFront | S3 bucket + CDN + WAF rules | Frontend estático (NextJS) |
| SES | Sender Identity + Configuration Set | Email transaccional |
| WAF | Web ACL + Rules | Protección OWASP Top 10 |
| Observability | CloudWatch Logs + Metrics + X-Ray | Tracing y monitoreo |

```
┌─────────────────────────────────────────────────────────────────┐
│                       Terraform Root Module                     │
│                                                                 │
│  ┌─────────┐ ┌──────────┐ ┌─────┐ ┌────────┐ ┌─────────────┐  │
│  │ Cognito │ │ DynamoDB │ │ SQS │ │  SES   │ │ Observability│  │
│  └─────────┘ └──────────┘ └─────┘ └────────┘ └─────────────┘  │
│  ┌─────────┐ ┌─────────────┐ ┌────────────┐ ┌─────────────┐   │
│  │ Lambda  │ │ API Gateway │ │ S3+CloudF. │ │     WAF     │   │
│  └─────────┘ └─────────────┘ └────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        ▲                                              │
        │           environments/{dev,prod}/           │
        └──────────────────────────────────────────────┘
```

## Prerrequisitos

- **AWS CLI** configurado con credenciales (`aws configure`)
- **Terraform** >= 1.5
- **Node.js** >= 20 (para verificar la app después del deploy)
- Cuenta AWS con permisos para crear: Cognito, DynamoDB, SQS, SES, Lambda, API Gateway, S3, CloudFront, WAF, IAM, CloudWatch, X-Ray

## Inicio Rápido

```bash
# 1. Navegar al entorno deseado
cd environments/dev

# 2. Inicializar Terraform (descarga providers y módulos)
terraform init

# 3. Revisar el plan de ejecución
terraform plan

# 4. Aplicar la infraestructura
terraform apply
```

Después del deploy, Terraform imprime los outputs: API URL, Cognito client ID, tabla DynamoDB, CloudFront domain, etc.

## Entornos

### Dev

```bash
cd environments/dev
```

| Setting | Valor |
|---------|-------|
| Dominio Cognito | `http://localhost:3000` |
| SES sender | `noreply@mini-onboarding.dev` |
| Deletion protection | **Desactivado** |
| CORS origins | `http://localhost:3000` |

Diseñado para desarrollo local. La protección de eliminación está desactivada para permitir `terraform destroy` sin fricción.

### Prod

```bash
cd environments/prod
```

| Setting | Valor |
|---------|-------|
| Dominio Cognito | `https://mini-onboarding.com` |
| SES sender | `noreply@mini-onboarding.com` |
| Deletion protection | **Activado** |
| CORS origins | `https://mini-onboarding.com` |

Protección de eliminación activada para prevenir borrado accidental de datos en producción.

## Módulos

### `modules/cognito`

User Pool de Cognito para autenticación de sellers:

- User Pool con esquema `email` + `seller_id`
- User Pool Client con `USER_PASSWORD_AUTH` y `REFRESH_TOKEN_AUTH`
- Dominio hosted UI auto-generado
- Password policy: mínimo 8 caracteres, mayúsculas, minúsculas, números, símbolos
- Tokens: access/id 1h, refresh 30 días

### `modules/dynamodb`

Tabla DynamoDB single-table con patrón de diseño para merchants:

- Billing mode: `PAY_PER_REQUEST` (on-demand)
- Hash key: `PK`, Range key: `SK`
- 2 Global Secondary Indexes (GSI1, GSI2)
- Encriptación at-rest habilitada
- Point-in-time recovery habilitado

### `modules/sqs`

Cola SQS para enriquecimiento asíncrono:

- Cola principal: `enrichment` (visibility timeout 300s, receive wait 20s)
- Dead letter queue: `enrichment-dlq` (retención 14 días)
- Redrive policy: maxReceiveCount = 3

### `modules/lambda`

Funciones Lambda para el backend:

- `createMerchant`: Validación síncrona de RUC, escritura a DynamoDB, encolado a SQS
- `enricher`: Polling de SQS, consulta a SUNAT, actualización de merchant, envío de email

### `modules/api-gateway`

API Gateway HTTP API v2:

- Rutas: `POST /merchants`, `GET /merchants`, `GET /merchants/{id}`, `PUT /merchants/{id}`
- Cognito Authorizer para validación JWT en edge
- Integraciones directas con Lambda

### `modules/s3-cloudfront`

Frontend estático con NextJS:

- S3 bucket para hosting
- CloudFront distribution para CDN global
- Origin Access Control (OAC)

### `modules/ses`

Servicio de email transaccional:

- Email identity (requiere verificación manual en AWS Console)
- Configuration set con TLS obligatorio
- Event destination a CloudWatch (bounce, complaint, delivery)

### `modules/waf`

Web Application Firewall:

- Web ACL asociada a API Gateway
- ReglasManaged para OWASP Top 10
- Rate limiting

### `modules/observability`

Monitoreo y tracing:

- CloudWatch Logs para Lambda functions
- CloudWatch Metrics para API Gateway
- X-Ray tracing distribuido

## Variables

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `environment` | `string` | — | Nombre del entorno (`dev`, `staging`, `prod`). Validado. |
| `project` | `string` | `mini-onboarding` | Nombre del proyecto para naming y tags |
| `aws_region` | `string` | `us-east-1` | Región AWS de despliegue |
| `ses_sender_email` | `string` | — | Email verificado para envío vía SES. Validado como email. |
| `cognito_callback_urls` | `list(string)` | `["http://localhost:3000/callback"]` | URLs de callback para OAuth flow |
| `cognito_logout_urls` | `list(string)` | `["http://localhost:3000/logout"]` | URLs de logout post sign-out |
| `cors_allow_origins` | `list(string)` | `[]` | Orígenes permitidos por CORS |
| `enable_deletion_protection` | `bool` | `true` | Protección de eliminación general |
| `dynamodb_deletion_protection` | `bool` | `true` | Protección de eliminación DynamoDB |

## Outputs

| Output | Descripción |
|--------|-------------|
| `api_url` | Invoke URL del HTTP API Gateway |
| `cognito_user_pool_id` | ID del User Pool de Cognito |
| `cognito_client_id` | Client ID del User Pool Client (sensitive) |
| `dynamodb_table_name` | Nombre de la tabla merchants |
| `sqs_queue_url` | URL de la cola de enrichment |
| `cloudfront_domain` | Domain del CloudFront distribution |

## Limpieza

```bash
cd environments/dev   # o environments/prod
terraform destroy
```

En `prod`, primero desactiva `enable_deletion_protection` y `dynamodb_deletion_protection` en `terraform.tfvars` antes de destruir.

## Notas Importantes

- **SES requiere verificación**: Después del primer `terraform apply`, revisa tu bandeja de entrada y confirma el email del sender. Sin verificación, SES no envía emails reales.
- **Cognito hosted UI**: El dominio generado es único y Terraform lo imprime en outputs. Úsalo para configurar el frontend.
- **DynamoDB naming**: La tabla se nombra como `{project}-{environment}-merchants` (ej: `mini-onboarding-dev-merchants`).
- **Backend S3**: El state se almacena en `mini-onboarding-tfstate` con locking via DynamoDB (`mini-onboarding-tflock`).
