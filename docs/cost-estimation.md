# Estimación de Costos — Mini Onboarding

## Supuestos

- **Usuarios activos**: 100 sellers
- **Merchants creados**: 500/mes
- **Enrichments**: 500/mes
- **API requests**: 10K/mes
- **Región**: us-east-1

## Desglose Mensual

### Compute

| Servicio             | Qty                     | Costo Unitario      | Costo Mensual |
| -------------------- | ----------------------- | ------------------- | ------------- |
| Lambda (API)         | 10K invocations × 200ms | $0.0000002083/100ms | $0.42         |
| Lambda (Enricher)    | 500 invocations × 2s    | $0.0000002083/100ms | $2.08         |
| **Subtotal Compute** |                         |                     | **$2.50**     |

### Storage

| Servicio             | Qty                  | Costo Unitario       | Costo Mensual |
| -------------------- | -------------------- | -------------------- | ------------- |
| DynamoDB (on-demand) | 1K writes + 5K reads | $1.25/million writes | $0.01         |
| DynamoDB storage     | 100 MB               | $0.25/GB             | $0.03         |
| S3 (frontend)        | 50 MB                | $0.023/GB            | $0.001        |
| **Subtotal Storage** |                      |                      | **$0.04**     |

### Networking

| Servicio                | Qty          | Costo Unitario         | Costo Mensual |
| ----------------------- | ------------ | ---------------------- | ------------- |
| CloudFront              | 1K requests  | $0.01/10K (first 10TB) | $0.001        |
| API Gateway             | 10K requests | $1.00/million          | $0.01         |
| **Subtotal Networking** |              |                        | **$0.01**     |

### Messaging

| Servicio               | Qty          | Costo Unitario | Costo Mensual |
| ---------------------- | ------------ | -------------- | ------------- |
| SQS                    | 500 messages | $0.40/million  | $0.0002       |
| SES                    | 500 emails   | $0.10/1000     | $0.05         |
| **Subtotal Messaging** |              |                | **$0.05**     |

### Auth

| Servicio          | Qty     | Costo Unitario          | Costo Mensual |
| ----------------- | ------- | ----------------------- | ------------- |
| Cognito           | 100 MAU | $0.0055/MAU (first 50K) | $0.55         |
| **Subtotal Auth** |         |                         | **$0.55**     |

### Observability

| Servicio                   | Qty         | Costo Unitario | Costo Mensual |
| -------------------------- | ----------- | -------------- | ------------- |
| CloudWatch Logs            | 1 GB        | $0.50/GB       | $0.50         |
| CloudWatch Metrics         | 10 custom   | $0.30/metric   | $3.00         |
| X-Ray                      | 100K traces | $5.00/million  | $0.50         |
| **Subtotal Observability** |             |                | **$4.00**     |

### Security

| Servicio              | Qty       | Costo Unitario | Costo Mensual |
| --------------------- | --------- | -------------- | ------------- |
| WAF                   | 1 web ACL | $5.00/web ACL  | $5.00         |
| WAF rules             | 10 rules  | $1.00/rule     | $10.00        |
| **Subtotal Security** |           |                | **$15.00**    |

**Nota**: WAF está **deshabilitado** actualmente (incompatible con CloudFront GLOBAL). El costo real sin WAF es ~$7.15/mes.

## Total Mensual

| Categoría     | Costo      |
| ------------- | ---------- |
| Compute       | $2.50      |
| Storage       | $0.04      |
| Networking    | $0.01      |
| Messaging     | $0.05      |
| Auth          | $0.55      |
| Observability | $4.00      |
| Security      | $0.00 (WAF deshabilitado) |
| **TOTAL**     | **$7.15**  |

**Con WAF habilitado**: $22.15/mes

## Notas sobre WAF

El WAF está **deshabilitado** actualmente porque es incompatible con CloudFront GLOBAL (requiere 2 WebACLs). 

**Costo actual sin WAF**: ~$7.15/mes

Opciones para habilitar WAF:
1. **Mantener WAF deshabilitado**: Para app básica/demo, la arquitectura serverless ya cubre OWASP A01-A06,A08-A10
2. **WAF básico**: Solo regla managed rule ($5/mes) en vez de 10 custom
3. **WAF completo**: 10 reglas OWASP ($15/mes) - para producción con tráfico real

## Palancas de Costo

### Donde escalaría feo

1. **Lambda invocations**: Si pasamos de 10K a 1M requests/mes → $200/mes
2. **DynamoDB**: Si necesitamos provisioned capacity → $50+/mes
3. **CloudFront**: Si el frontend recibe mucho tráfico → $100+/mes
4. **X-Ray**: Si habilitamos tracing en todas las lambdas → $50+/mes

### Cómo controlar

1. **Lambda**: Usar reserved concurrency para limits
2. **DynamoDB**: On-demand para empezar, provisioned cuando sea predecible
3. **CloudFront**: Price class 100 (solo Americas) en vez de All
4. **X-Ray**: Sampling rate del 10% en producción
5. **CloudWatch Logs**: Retención de 30 días (no infinita)

## Comparación con Alternativas

| Arquitectura             | Costo Mensual | Notas                      |
| ------------------------ | ------------- | -------------------------- |
| **Nuestra (serverless)** | **$22**       | Pay-per-request, minimal   |
| EC2 + RDS                | ~$150         | 2 instances + RDS t3.micro |
| ECS Fargate              | ~$80          | 2 tasks + RDS              |
| Kubernetes (EKS)         | ~$300+        | Overkill para este caso    |

## Free Tier

AWS Free Tier (12 meses) cubre:

- Lambda: 1M requests/mes gratis
- DynamoDB: 25 GB storage + 25 RCU/WCU gratis
- S3: 5 GB gratis
- CloudFront: 1 TB transfer out
- CloudWatch: 10 custom metrics gratis
- Cognito: 50K MAU gratis

**Con Free Tier, el costo real sería ~$5/mes** (solo WAF + logs extras).
