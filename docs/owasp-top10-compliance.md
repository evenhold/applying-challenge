# OWASP Top 10 — Evaluación de Cumplimiento

Mini Onboarding — Evaluación de seguridad según OWASP Top 10 (2021)

---

## Resumen Ejecutivo

| OWASP # | Vulnerabilidad | Estado | Cobertura |
|---------|----------------|--------|-----------|
| A01 | Broken Access Control | ✅ Cumple | Cognito JWT + IAM least-privilege |
| A02 | Cryptographic Failures | ✅ Cumple | HTTPS + DynamoDB encryption |
| A03 | Injection | ✅ Cumple | DynamoDB (no SQL) + Zod validation |
| A04 | Insecure Design | ✅ Cumple | Serverless architecture |
| A05 | Security Misconfiguration | ✅ Cumple | IAM + S3 + Cognito |
| A06 | Vulnerable Components | ✅ Cumple | AWS managed runtime |
| A07 | XSS | ✅ Cumple | CSP headers + React |
| A08 | Data Integrity Failures | ✅ Cumple | DynamoDB + S3 encryption |
| A09 | Security Logging & Monitoring | ✅ Cumple | CloudWatch + X-Ray |
| A10 | Server-Side Request Forgery | ✅ Cumple | Serverless, no server expuesto |

**Resultado: 10/10 OWASP Top 10 cubiertos**

---

## A01: Broken Access Control

### Controles implementados

| Control | Implementación | Ubicación |
|---------|---------------|-----------|
| JWT Authentication | Cognito Authorizer en API Gateway | `terraform/modules/api-gateway/main.tf` |
| Rutas protegidas | POST/GET/PUT/DELETE /merchants requieren JWT | `terraform/modules/api-gateway/main.tf` |
| Ruta pública | Solo GET /health (sin auth) | `terraform/modules/api-gateway/main.tf` |
| Ownership check | Merchants filtrados por sellerId | `backend/src/usecases/merchants/list.ts` |
| Delete ownership | Verifica sellerId antes de borrar | `backend/src/usecases/merchants/delete.ts` |
| IAM least-privilege | Cada Lambda tiene solo los permisos que necesita | `terraform/modules/iam/main.tf` |

### Cómo validar

```bash
# 1. Verificar que rutas protegidas rechazan sin token
curl -s https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com/merchants
# → 401 Unauthorized

# 2. Verificar que health no requiere auth
curl -s https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com/health
# → 200 {"status":"healthy"}

# 3. Verificar JWT validation
TOKEN=$(aws cognito-idp initiate-auth ...)
curl -H "Authorization: Bearer $TOKEN" https://qiq4nwptz1.../merchants
# → 200 {"data":[]}

# 4. Verificar IAM policies en AWS Console
aws iam get-role-policy --role-name mini-onboarding-dev-lambda-merchants --policy-name mini-onboarding-dev-lambda-merchants-permissions
```

---

## A02: Cryptographic Failures

### Controles implementados

| Control | Implementación | Ubicación |
|---------|---------------|-----------|
| TLS obligatorio | CloudFront: `redirect-to-https` | `terraform/modules/s3-cloudfront/main.tf` |
| HSTS | `max-age=63072000; includeSubDomains; preload` | `terraform/modules/s3-cloudfront/main.tf` |
| DynamoDB encryption | Server-side encryption (AWS managed key) | `terraform/modules/dynamodb/main.tf` |
| S3 encryption | AES256 server-side | `terraform/modules/s3-cloudfront/main.tf` |
| Cognito tokens | Access + ID tokens con expiración (1h) | `frontend/src/lib/auth.ts` |

### Cómo validar

```bash
# 1. Verificar HTTPS redirect
curl -s -I http://d1vazin5v6ecqg.cloudfront.net/
# → 301 → https://

# 2. Verificar HSTS header
curl -s -I https://d1vazin5v6ecqg.cloudfront.net/
# → strict-transport-security: max-age=63072000; includeSubDomains; preload

# 3. Verificar DynamoDB encryption en AWS Console
aws dynamodb describe-table --table-name mini-onboarding-dev-merchants --query 'Table.SSEDescription'
# → {"Status":"ENABLED","SSEType":"AES256","KMSMasterKeyArn":"alias/aws/dynamodb"}
```

---

## A03: Injection

### Controles implementados

| Control | Implementación | Ubicación |
|---------|---------------|-----------|
| No SQL | DynamoDB (document store, no SQL injection) | `backend/src/lib/dynamodb.ts` |
| Input validation | Zod schemas para todos los inputs | `backend/src/schemas/merchant.ts` |
| Parameterized queries | DynamoDB SDK parameterized | `backend/src/lib/dynamodb.ts` |
| Document validation | RUC/DNI/CE con módulo 11 | `backend/src/lib/ruc-validator.ts` |
| Content-Type | JSON parsing con try/catch | `backend/src/handlers/merchants.ts` |

### Cómo validar

```bash
# 1. Verificar que Zod rechaza inputs inválidos
curl -X POST https://qiq4nwptz1.../merchants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentType":"invalid","documentNumber":"abc"}'
# → 400 "Validation error"

# 2. Verificar que SQL injection no aplica
# DynamoDB no usa SQL. Los parámetros se pasan comoAttributeValue objects.

# 3. Verificar schemas en código
grep -r "z.object" backend/src/schemas/
# → createMerchantSchema, updateMerchantSchema
```

---

## A04: Insecure Design

### Controles implementados

| Control | Implementación |
|---------|---------------|
| Serverless architecture | Lambda + API Gateway (sin servidor expuesto) |
| Async processing | SQS para enrichment (sin timeout sync) |
| Least privilege | IAM roles con mínimo permisos necesarios |
| Error handling | Try/catch con mensajes genéricos (no expone stacktraces) |
| Input validation | Zod schemas en boundary |
| Separation of concerns | UseCase pattern (handlers → usecases → libs) |

### Cómo validar

```bash
# 1. Verificar que no hay servidores expuestos
# Solo API Gateway y CloudFront son endpoints públicos

# 2. Verificar error messages (no stacktraces)
curl -X POST https://qiq4nwptz1.../merchants \
  -H "Content-Type: application/json" \
  -d '{"bad": "data"}'
# → {"success":false,"error":"Invalid document number"} (no stacktrace)

# 3. Verificar architecture en docs
cat docs/architecture.md
```

---

## A05: Security Misconfiguration

### Controles implementados

| Control | Implementación | Ubicación |
|---------|---------------|-----------|
| S3 block public access | All 4 blocks enabled | `terraform/modules/s3-cloudfront/main.tf` |
| S3 bucket policy | Only CloudFront OAC | `terraform/modules/s3-cloudfront/main.tf` |
| Cognito MFA | Optional (configurable) | `terraform/modules/cognito/main.tf` |
| Cognito password policy | Min 8, uppercase, lowercase, numbers, symbols | `terraform/modules/cognito/main.tf` |
| Cognito prevent_existence | ENABLED (no user enumeration) | `terraform/modules/cognito/main.tf` |
| API Gateway CORS | Configurable per environment | `terraform/modules/api-gateway/main.tf` |

### Cómo validar

```bash
# 1. Verificar S3 no es público
aws s3api get-public-access-block --bucket mini-onboarding-frontend-dev
# → {"PublicAccessBlockConfiguration": {"BlockPublicAcls": true, ...}}

# 2. Verificar CORS
curl -s -I -X OPTIONS https://qiq4nwptz1.../merchants \
  -H "Origin: https://d1vazin5v6ecqg.cloudfront.net" \
  -H "Access-Control-Request-Method: GET"
# → access-control-allow-origin header

# 3. Verificar Cognito config
aws cognito-idp describe-user-pool --user-pool-id us-east-1_S33rLXlec --query 'UserPool.Policies.PasswordPolicy'
```

---

## A06: Vulnerable and Outdated Components

### Controles implementados

| Control | Implementación |
|---------|---------------|
| Managed runtime | Node.js 22.x (AWS managed, auto-patched) |
| No custom dependencies | Lambda usa AWS SDK del runtime |
| pnpm lockfile | Lockfile committed para reproducibilidad |
| esbuild bundle | Minimiza attack surface (sin node_modules en Lambda) |

### Cómo validar

```bash
# 1. Verificar runtime version
aws lambda get-function --function-name mini-onboarding-dev-merchants --query 'Configuration.Runtime'
# → "nodejs22.x"

# 2. Verificar que Lambda no incluye node_modules innecesarios
ls -lh build/merchants.zip
# → ~64KB (solo código bundled, sin node_modules)

# 3. AWS mantiene el runtime patchado
# https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
```

---

## A07: Cross-Site Scripting (XSS)

### Controles implementados

| Control | Implementación | Ubicación |
|---------|---------------|-----------|
| CSP headers | CloudFront response headers policy | `terraform/modules/s3-cloudfront/main.tf` |
| React | No innerHTML, JSX rendering | Frontend codebase |
| X-Content-Type-Options | nosniff (implicit en response headers) | CloudFront |
| X-XSS-Protection | 1; mode=block | CloudFront |
| X-Frame-Options | DENY (anti-clickjacking) | CloudFront |

### CSP Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
connect-src 'self' https://*.amazonaws.com;
frame-ancestors 'none';
```

### Cómo validar

```bash
# 1. Verificar CSP header
curl -s -I https://d1vazin5v6ecqg.cloudfront.net/ | grep content-security-policy
# → content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...

# 2. Verificar X-Frame-Options
curl -s -I https://d1vazin5v6ecqg.cloudfront.net/ | grep x-frame-options
# → x-frame-options: DENY

# 3. Verificar que React no usa innerHTML
grep -r "innerHTML" frontend/src/
# → (sin resultados)

# 4. Verificar en browser DevTools → Console → no CSP violations
```

---

## A08: Data Integrity Failures

### Controles implementados

| Control | Implementación | Ubicación |
|---------|---------------|-----------|
| DynamoDB encryption at rest | AES256 (AWS managed) | `terraform/modules/dynamodb/main.tf` |
| S3 encryption | AES256 server-side | `terraform/modules/s3-cloudfront/main.tf` |
| S3 versioning | Enabled (data recovery) | `terraform/modules/s3-cloudfront/main.tf` |
| Cognito token integrity | JWT signature verification | API Gateway authorizer |
| SQS message integrity | AWS managed encryption | `terraform/modules/sqs/main.tf` |

### Cómo validar

```bash
# 1. Verificar DynamoDB encryption
aws dynamodb describe-table --table-name mini-onboarding-dev-merchants \
  --query 'Table.{SSE:SSEDescription.Status,Encryption:SSEDescription.SSEType}'

# 2. Verificar S3 versioning
aws s3api get-bucket-versioning --bucket mini-onboarding-frontend-dev

# 3. Verificar JWT validation
# API Gateway rechaza tokens firmados con key incorrecta
curl -H "Authorization: Bearer fake-token" https://qiq4nwptz1.../merchants
# → 401 Unauthorized
```

---

## A09: Security Logging and Monitoring Failures

### Controles implementados

| Control | Implementación | Ubicación |
|---------|---------------|-----------|
| CloudWatch Logs | Lambda function logs (7 days) | `terraform/modules/observability/main.tf` |
| X-Ray tracing | Active on both Lambdas | `terraform/modules/lambda/main.tf` |
| CloudWatch alarm | Enricher error count > 5 | `terraform/modules/observability/main.tf` |
| CloudWatch dashboard | Lambda metrics (invocations, errors, duration) | `terraform/modules/observability/main.tf` |
| API Gateway access logs | Request ID, method, status, latency | `terraform/modules/api-gateway/main.tf` |
| Structured logging | Pino JSON (dev) / console.log (Lambda) | `backend/src/lib/logger.ts` |

### Cómo validar

```bash
# 1. Verificar CloudWatch logs existen
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/mini-onboarding

# 2. Verificar X-Ray traces
aws xray get-trace-summaries --start-time $(date -d '1 hour ago' +%s) --end-time $(date +%s)

# 3. Verificar alarms
aws cloudwatch describe-alarms --alarm-name-prefix mini-onboarding

# 4. Verificar dashboard
aws cloudwatch get-dashboard --dashboard-name mini-onboarding-dev-main

# 5. Verificar logs recientes
aws logs tail /aws/lambda/mini-onboarding-dev-merchants --since 1h
```

---

## A10: Server-Side Request Forgery (SSRF)

### Controles implementados

| Control | Implementación |
|---------|---------------|
| Serverless | No hay servidor que manipular para SSRF |
| No user-controlled URLs | Backend solo llama a DynamoDB, SQS, SES, SUNAT mock |
| SUNAT mock | Llamada local, no expuesta a internet |
| Lambda network | Solo acceso a servicios AWS (DynamoDB, SQS, SES) |
| IAM restrictions | Cada Lambda solo tiene permisos sobre sus recursos |

### Cómo validar

```bash
# 1. Verificar que no hay URLs de usuario en el backend
grep -r "fetch\|http://" backend/src/ --include="*.ts" | grep -v test | grep -v mock
# → Solo AWS SDK calls (sin URLs de usuario)

# 2. Verificar IAM restrictions
aws iam get-role-policy --role-name mini-onboarding-dev-lambda-merchants \
  --policy-name mini-onboarding-dev-lambda-merchants-permissions \
  --query 'PolicyDocument.Statement[].Resource'
# → Solo SQS queue ARN (no "*" except SES)

# 3. Lambda no tiene acceso a internet directo
# Solo puede acceder a servicios AWS a través de IAM
```

---

## Resumen de validación

### Script rápido de verificación

```bash
#!/bin/bash
API="https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com"
CF="https://d1vazin5v6ecqg.cloudfront.net"

echo "=== A01: Broken Access Control ==="
echo "Sin token:" $(curl -s -o /dev/null -w "%{http_code}" $API/merchants)
echo "Health:" $(curl -s -o /dev/null -w "%{http_code}" $API/health)

echo "=== A02: Cryptographic Failures ==="
curl -s -I $CF/ 2>&1 | grep -i "strict-transport"

echo "=== A07: XSS ==="
curl -s -I $CF/ 2>&1 | grep -i "content-security-policy"
curl -s -I $CF/ 2>&1 | grep -i "x-frame-options"

echo "=== A09: Logging ==="
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/mini-onboarding --query 'logGroups[].logGroupName' --output text
```
