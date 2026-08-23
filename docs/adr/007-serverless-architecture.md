# ADR-007: Arquitectura Serverless

## Estado

Aprobado

## Contexto

El proyecto necesita una arquitectura que:

- Minimice costos (startup/consumo bajo)
- Escale automáticamente sin administrar servidores
- Sea nativa de AWS
- Permita desarrollo rápido sin infraestructura compleja

## Decisión

**100% Serverless** en todas las capas de la arquitectura.

### Stack Serverless

| Capa       | Servicio           | Why serverless                            | Why no serverless                |
| ---------- | ------------------ | ----------------------------------------- | -------------------------------- |
| Compute    | Lambda             | Pay-per-request, auto-scale, zero ops     | EC2: $70+/mes, requiere patching |
| API        | API Gateway v2     | Serverless routing, JWT authorizer nativo | ALB + EC2: más caro, más config  |
| Database   | DynamoDB           | On-demand, sin provisionar, GSIs          | RDS: $15+/mes, requiere manage   |
| Messaging  | SQS                | Serverless queue, DLQ, reintentos         | RabbitMQ: requiere EC2           |
| Auth       | Cognito            | Serverless auth, MFA, JWT                 | Keycloak: requiere EC2           |
| Hosting    | S3 + CloudFront    | Serverless CDN, zero ops                  | Nginx: requiere EC2              |
| Email      | SES                | Serverless email, pay-per-email           | SMTP: requiere servidor          |
| Monitoring | CloudWatch + X-Ray | Nativo AWS, serverless                    | Datadog: costo adicional         |

## Justificación

### 1. Costos

```
Serverless (nuestro caso):
  Lambda:      $2.50/mes  (10K requests)
  DynamoDB:    $0.04/mes  (on-demand)
  API Gateway: $0.01/mes  (10K requests)
  SQS:         $0.0002/mes
  Cognito:     $0.55/mes  (100 MAU)
  SES:         $0.05/mes  (500 emails)
  TOTAL:       ~$3.15/mes (sin WAF)

No-serverless equivalente:
  EC2 t3.micro:  $70/mes (24/7)
  RDS t3.micro:  $15/mes (24/7)
  ALB:           $16/mes (mínimo)
  TOTAL:         ~$101/mes
```

**Ahorro: ~97% con serverless.**

### 2. Ops

| Operación   | Serverless            | No-serverless                |
| ----------- | --------------------- | ---------------------------- |
| Patching OS | No                    | Sí (mensual)                 |
| Scaling     | Automático            | Manual o auto-scaling config |
| Backups     | Automático (DynamoDB) | Manual o RDS automation      |
| Monitoring  | Nativo (CloudWatch)   | Instalar agente              |
| SSL/TLS     | Automático (ACM)      | Manual cert management       |

### 3. Desarrollo

- **Sin servidores que provisionar**: Deploy con `sam deploy` o `terraform apply`
- **Sin networking complejo**: Lambda se conecta a DynamoDB/SQS vía IAM
- **Sin Docker en producción**: Lambda usa su propio runtime
- **Local dev**: FLOCI emula todo localmente

## Alternativas Evaluadas

| Arquitectura             | Costo/mes | Ops (mantenimiento de infra) | DX (experiencia de desarrollo) | Decisión |
| ------------------------ | --------- | ---------- | ------------- | -------- |
| **Serverless (elegido)** | **$3**    | **Mínimo** | **Excelente** | ✅       |
| EC2 + RDS                | $101      | Alto       | Medio         | ❌       |
| ECS Fargate              | $50       | Medio      | Bueno         | ❌       |
| EKS                      | $300+     | Muy alto   | Complejo      | ❌       |

## Consecuencias

### Positivas

- Costo mínimo mientras el tráfico sea bajo
- Zero ops: no hay servidores que mantener
- Auto-scale instantáneo a demanda
- Desarrollo rápido con FLOCI local

### Negativas

- **Cold starts**: Lambda puede tardar 200ms-1s en cold start
- **Vendor lock-in**: Código usa SDK de AWS (DynamoDB, SQS)
- **Limits de Lambda**: 15 min timeout, 10GB RAM máximo
- **Debugging más difícil**: No hay SSH a Lambda

### Mitigaciones

- **Cold starts**: Provisioned concurrency para APIs críticas
- **Vendor lock-in**: Aceptado como trade-off por simplicidad
- **Limits**: Suficientes para nuestro caso de uso
- **Debugging**: X-Ray tracing + CloudWatch logs

## Criterios de Evaluación

Para el challenge, la decisión de serverless demuestra:

1. **Criterio de costos**: "Escogería EC2+RDS si tuviera 10K requests/hora, pero para 10K/mes, serverless es 30x más barato"
2. **Conocimiento de trade-offs**: "Los cold starts son aceptables para nuestro caso — el seller no notará 200ms extra"
3. **Escalabilidad**: "Si crecemos a 1M requests/mes, serverless escala automáticamente sin cambiar nada"
4. **Operaciones**: "No necesito un DevOps para mantener servidores"
