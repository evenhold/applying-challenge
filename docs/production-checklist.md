# Production Checklist — Mini Onboarding

Guía paso a paso para pasar de DEV (Docker + FLOCI) a PROD (AWS real).

---

## Visión General

```
DEV (Docker + FLOCI):
  Browser → NextJS Dev Server (:3000)
    → /api/* (proxy routes)
    → Backend (:3001) → FLOCI (:4566)
    → Worker (polling SQS cada 2s)

PROD (AWS):
  Browser → S3 + CloudFront (estático)
    → API Gateway → Lambda handlers
    → SQS Event Source Mapping → Lambda enricher
    → DynamoDB real
    → Cognito real
    → SES real
```

---

## 1. Qué SÍ funciona igual (sin cambios)

Estos archivos/functiones son idénticos en DEV y PROD:

| Componente | Archivo(s) | Por qué |
|------------|-----------|---------|
| Lógica de negocio | `usecases/*` | Funciones puras, sin dependencia de infra |
| Lambda handlers | `handlers/merchants.ts`, `handlers/enricher.ts`, `handlers/health.ts` | Ya escritos como Lambda handlers |
| Validación Zod | `schemas/*` | Runtime validation, idéntica |
| Types TypeScript | `types/*` | Tipos puros |
| Validación RUC | `lib/ruc-validator.ts` | Función pura |
| DynamoDB client | `lib/dynamodb.ts` | `endpoint: undefined` → apunta a AWS real |
| SQS client | `lib/sqs.ts` | `endpoint: undefined` → apunta a AWS real |
| SES client | `lib/ses.ts` | `endpoint: undefined` → apunta a AWS real |
| API Client frontend | `lib/api.ts` | Usa `NEXT_PUBLIC_API_URL` configurable |
| Auth frontend | `lib/auth.ts` | Usa `NEXT_PUBLIC_COGNITO_URL` configurable |
| Tests unitarios | `*.test.ts` | Corren igual en ambos ambientes |

---

## 2. Qué NO se despliega a producción

Estos archivos son **solo para DEV**:

| Archivo | En DEV | En PROD | Reemplazo |
|---------|--------|---------|-----------|
| `server.ts` | HTTP server Node.js en `:3001` | **No se usa** | API Gateway |
| `router.ts` | Routing manual `findHandler()` | **No se usa** | API Gateway route config |
| `worker.ts` | SQS polling loop cada 2s | **No se usa** | SQS Event Source Mapping → Lambda |
| `frontend/src/app/api/*` (3 routes) | Proxy CORS a FLOCI/Backend | **No existen** en build estático | API Gateway |

### Por qué no se despliegan

- `server.ts`: En Lambda, AWS invoca el handler directamente con `LambdaEvent`. No hay servidor HTTP.
- `router.ts`: API Gateway define las rutas (`POST /merchants`, `GET /merchants/:id`, etc.)
- `worker.ts`: SQS invoca Lambda automáticamente cuando hay mensajes. No hay polling manual.
- `/api/*` routes: NextJS exporta HTML estático (`out/`). No hay servidor Node.js procesando rutas API.

---

## 3. Cambios de configuración (ENV vars)

### Variables que CAMBIAN de valor

| Variable | DEV | PROD |
|----------|-----|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | `https://<api-id>.execute-api.<region>.amazonaws.com` |
| `NEXT_PUBLIC_COGNITO_URL` | `http://localhost:3000/api` | `https://cognito-idp.<region>.amazonaws.com` |
| `SQS_QUEUE_URL` | `http://floci:4566/000000000000/merchants-enrichment` | `https://sqs.<region>.amazonaws.com/<account-id>/merchants-enrichment` |
| `SES_SENDER_EMAIL` | `noreply@mini-onboarding.local` | Email verificado en SES |
| `DYNAMODB_TABLE` | `merchants` | `merchants` (mismo nombre, configurable) |
| `COGNITO_USER_POOL_ID` | Generado por FLOCI | Generado por Terraform |
| `COGNITO_CLIENT_ID` | Generado por FLOCI | Generado por Terraform |

### Variables que se ELIMINAN de producción

| Variable | Por qué |
|----------|---------|
| `AWS_ENDPOINT_URL` | No se necesita — Lambda usa IAM Role para AWS real |
| `FLOCI_HOSTNAME` | No existe en AWS |
| `AUTH_MOCK` | NUNCA en producción — requiere JWT real |
| `COGNITO_ENDPOINT` | No se necesita — API route proxy se elimina |
| `BACKEND_URL` | No se necesita — API route proxy se elimina |
| `AWS_ACCESS_KEY_ID` | No se necesita — Lambda usa IAM Role |
| `AWS_SECRET_ACCESS_KEY` | No se necesita — Lambda usa IAM Role |

### Variables que se AGREGAN en producción

| Variable | Descripción |
|----------|-------------|
| `AWS_REGION` | Región de deployment |
| `AWS_LAMBDA_EXECUTION_ROLE` | IAM Role del Lambda (automático en Lambda) |

---

## 4. Cambios de código (mínimos)

### 4.1. Eliminar API routes del frontend

```
ELIMINAR:
frontend/src/app/api/auth/route.ts
frontend/src/app/api/merchants/route.ts
frontend/src/app/api/merchants/[id]/route.ts
```

**Por qué**: En producción, el frontend es estático (S3+CloudFront). No hay servidor NextJS. Las rutas API de NextJS solo funcionan con `next start` (SSR mode).

**Impacto**: Ninguno, porque el código ya usa `lib/api.ts` con `NEXT_PUBLIC_API_URL`.

### 4.2. Eliminar variables de entorno del compose.yml del frontend

```yaml
# ELIMINAR del compose.yml:
COGNITO_ENDPOINT=${COGNITO_ENDPOINT}
COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
BACKEND_URL=${BACKEND_URL}
```

**Por qué**: Estas variables eran para los API route proxies. En producción no existen.

### 4.3. Verificar email en ses.ts

```typescript
// VERIFICAR que esto usa el email del merchant, no hardcodeado:
const email = buildEnrichmentCompleteEmail(
  enriched.email || enriched.sellerId,  // ← email real del seller
  sunatData.businessName,
  documentNumber,
);
```

**Estado actual**: ✅ Ya corregido en esta sesión.

---

## 5. Packaging para Lambda

### Backend (handlers)

El `Dockerfile.backend` actual construye un contenedor completo. Para Lambda se necesita:

**Opción A: esbuild bundle** (recomendado)
```bash
esbuild src/handlers/merchants.ts --bundle --platform=node --outfile=dist/merchants/index.js
esbuild src/handlers/enricher.ts --bundle --platform=node --outfile=dist/enricher/index.js
```

**Opción B: Lambda Container Image**
Usar `public.ecr.aws/lambda/nodejs:24` como base. Mantener el Dockerfile pero cambiar CMD.

### Frontend (estático)

```bash
cd frontend
pnpm build           # next build
npx next export       # genera out/ con HTML estático
aws s3 sync out/ s3://<bucket> --delete
```

### Worker → No existe

`worker.ts` se reemplaza por SQS Event Source Mapping en Terraform:

```hcl
resource "aws_lambda_event_source_mapping" "enricher" {
  event_source_arn = aws_sqs_queue.merchants_enrichment.arn
  function_name    = aws_lambda_function.enricher.arn
  batch_size       = 10
}
```

---

## 6. Infraestructura Terraform (Fase 10)

### Módulos necesarios

| Módulo | Recursos | Dependencias |
|--------|----------|-------------|
| `cognito/` | User Pool, Client, Domain | Ninguna |
| `dynamodb/` | Table + 2 GSIs | Ninguna |
| `sqs/` | Queue + DLQ | Ninguna |
| `lambda/` | 2 functions (createMerchant, enricher) | DynamoDB, SQS, SES, Cognito |
| `api-gateway/` | HTTP API + routes + Cognito Authorizer | Lambda, Cognito |
| `s3-cloudfront/` | S3 bucket + CloudFront distribution | Ninguna |
| `ses/` | Email identity (verificación) | Ninguna |
| `waf/` | Web ACL + rules | CloudFront |
| `observability/` | CloudWatch Logs, Metrics, Alarms, X-Ray | Todos |
| `iam/` | Roles para Lambdas | Ninguna |

### Orden de deploy

```
1. Cognito (User Pool + Client)
2. DynamoDB (tabla + GSIs)
3. SQS (queue + DLQ)
4. SES (email verification)
5. IAM (roles para Lambdas)
6. Lambda (createMerchant + enricher)
7. API Gateway (routes + Cognito Authorizer)
8. S3 + CloudFront (frontend estático)
9. WAF (protección)
10. Observability (logs, metrics, alarms)
```

### Decisiones de Terraform

| Decisión | Opción recomendada | Alternativa |
|----------|-------------------|-------------|
| Ambientes | **2** (dev + prod) con modules compartidos | 1 solo (más simple pero más riesgo) |
| State backend | S3 + DynamoDB lock | Local (solo para empezar) |
| Cognito Hosted UI | Sí (más simple) | Custom login page |
| Lambda packaging | esbuild bundle | Container Image |
| DynamoDB billing | On-demand | Provisioned |
| CloudFront caching | Mínimo (SPA) | Agresivo |
| WAF | AWS Managed Rules (OWASP) | Custom rules |

---

## 7. Checklist de deploy

### Pre-deploy

- [ ] `AUTH_MOCK=false` (o eliminar la variable)
- [ ] Verificar `SES_SENDER_EMAIL` es un email verificado en SES
- [ ] Verificar `DYNAMODB_TABLE` coincide con el nombre en Terraform
- [ ] Verificar `COGNITO_USER_POOL_ID` y `COGNITO_CLIENT_ID` son los de AWS real
- [ ] Verificar `SQS_QUEUE_URL` apunta a la cola real de AWS
- [ ] Verificar `NEXT_PUBLIC_API_URL` apunta a API Gateway URL
- [ ] Verificar `NEXT_PUBLIC_COGNITO_URL` apunta a Cognito endpoint real

### Deploy

- [ ] `terraform init` + `terraform plan` + `terraform apply`
- [ ] Verificar Lambda functions en AWS Console
- [ ] Verificar API Gateway routes en AWS Console
- [ ] Verificar DynamoDB table + GSIs
- [ ] Verificar SQS queue + Event Source Mapping
- [ ] Verificar Cognito User Pool + Client
- [ ] Build frontend: `pnpm build && npx next export`
- [ ] Sync a S3: `aws s3 sync out/ s3://<bucket> --delete`
- [ ] Invalidar CloudFront: `aws cloudfront create-invalidation`

### Post-deploy

- [ ] Test `GET /health` → 200
- [ ] Test login con Cognito real
- [ ] Test `POST /merchants` → 201
- [ ] Test `GET /merchants` → 200
- [ ] Test `GET /merchants/:id` → 200
- [ ] Test `PUT /merchants/:id` → 200
- [ ] Verificar enrichment async (SQS → Lambda → DynamoDB)
- [ ] Verificar email (SES)
- [ ] Verificar CloudWatch logs
- [ ] Verificar CloudWatch metrics
- [ ] Verificar X-Ray traces

---

## 8. Entornos

### 2 ambientes (recomendado)

| Ambiente | Propósito | URL |
|----------|-----------|-----|
| `dev` | Desarrollo y pruebas | `https://dev.mini-onboarding.com` |
| `prod` | Producción | `https://mini-onboarding.com` |

```hcl
# terraform/environments/dev/terraform.tfvars
environment = "dev"
dynamodb_table = "merchants-dev"
cognito_pool_name = "mini-onboarding-sellers-dev"

# terraform/environments/prod/terraform.tfvars
environment = "prod"
dynamodb_table = "merchants"
cognito_pool_name = "mini-onboarding-sellers"
```

### 1 ambiente (más simple)

Si el presupuesto es limitado, un solo ambiente con todo en producción:

```hcl
# terraform/terraform.tfvars
environment = "prod"
dynamodb_table = "merchants"
```

---

## 9. Costos estimados (optimizados para app básica)

```
Producción (bajo tráfico, ~10K requests/mes):
  Lambda merchants (128MB):   $0.40/mes
  Lambda enricher (256MB):    $0.40/mes
  DynamoDB (on-demand):       $0.04/mes
  API Gateway (HTTP API):     $0.10/mes
  SQS + DLQ:                  $0.0002/mes
  Cognito (100 MAU):          $0.55/mes
  SES:                        $0.05/mes
  S3 + CloudFront:            $0.52/mes
  WAF (3 reglas OWASP):       $8.00/mes
  CloudWatch + X-Ray:         $0.80/mes
  ─────────────────────────────────────────
  TOTAL:                      ~$10.86/mes
  Sin WAF:                    ~$2.86/mes (pero sin protección OWASP)
```

### Detalle de costos por servicio

| Servicio | Recurso | Costo/mes | Optimización |
|----------|---------|-----------|--------------|
| **Lambda** | merchants (128MB, 10s) | $0.40 | Reducido de 256MB |
| **Lambda** | enricher (256MB, 60s) | $0.40 | Reducido de 512MB |
| **DynamoDB** | tabla + 2 GSIs (on-demand) | $0.04 | PITR deshabilitado en dev |
| **API Gateway** | HTTP API v2 | $0.10 | — |
| **SQS** | cola + DLQ | $0.0002 | — |
| **Cognito** | User Pool + Client | $0.55 | — |
| **SES** | Email transaccional | $0.05 | — |
| **S3** | Frontend bucket | $0.02 | — |
| **CloudFront** | CDN distribution | $0.50 | PriceClass_100 |
| **WAF** | Web ACL + 3 rules | $8.00 | OWASP Top 10 |
| **X-Ray** | Distributed tracing | $0.50 | — |
| **CloudWatch** | Logs (7d) + 1 alarm + dashboard | $0.30 | Retención reducida |

### OWASP Top 10 — cobertura WAF

| OWASP # | Vulnerabilidad | WAF Rule | Estado |
|---------|----------------|----------|--------|
| A01 | Broken Access Control | Cognito Authorizer | ✅ |
| A02 | Cryptographic Failures | HTTPS everywhere | ✅ |
| A03 | Injection | AWSManagedRulesCommonRuleSet | ✅ |
| A04 | Insecure Design | Arquitectura serverless | ✅ |
| A05 | Security Misconfiguration | AWSManagedRulesCommonRuleSet | ✅ |
| A06 | Vulnerable Components | Managed by AWS | ✅ |
| A07 | XSS | AWSManagedRulesCommonRuleSet | ✅ |
| A08 | Data Integrity | DynamoDB + S3 encryption | ✅ |
| A09 | Logging | CloudWatch + X-Ray | ✅ |
| A10 | SSRF | AWSManagedRulesKnownBadInputsRuleSet | ✅ |

### Recursos que NO generan costo

- IAM Roles + Policies
- SES Email Identity (verificación)
- Lambda Permissions
- Event Source Mapping
- S3 Bucket Policy + Encryption + Versioning

### Escalabilidad

| Tráfico | Costo/mes estimado |
|---------|-------------------|
| 10K requests/mes | ~$10.86 |
| 100K requests/mes | ~$25 |
| 1M requests/mes | ~$150 |
| 10M requests/mes | ~$1,200 |

---

## 10. Rollback

Si algo falla después del deploy:

```bash
# 1. Revertir frontend (S3)
aws s3 sync s3://<bucket>-backup s3://<bucket> --delete

# 2. Revertir Lambda (si se actualizó el código)
terraform apply -target=lambda_function.merchants -var="image_tag=previous"

# 3. Revertir Terraform completo
terraform apply -auto-approve  # con el estado anterior
```
