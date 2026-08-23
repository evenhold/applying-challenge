# Arquitectura — Mini Onboarding

## Diagrama

```mermaid
graph TB
    subgraph "Frontend"
        A[NextJS Static<br/>S3 + CloudFront]
    end

    subgraph "Edge"
        B[CloudFront<br/>CDN + WAF]
    end

    subgraph "Auth"
        C[Cognito<br/>User Pools]
    end

    subgraph "API"
        D[API Gateway v2<br/>HTTP API]
        E[Lambda API<br/>Node.js 24]
    end

    subgraph "Data"
        F[DynamoDB<br/>Single Table]
    end

    subgraph "Async"
        G[SQS<br/>merchants-enrichment]
        H[SQS DLQ<br/>merchants-enrichment-dlq]
        I[Lambda Enricher<br/>Node.js 24]
    end

    subgraph "External"
        J[SUNAT Mock<br/>Delay 1-5s]
    end

    subgraph "Notification"
        K[SES<br/>Email Service]
    end

    subgraph "Observability"
        L[CloudWatch<br/>Logs + Metrics]
        M[X-Ray<br/>Tracing]
    end

    A -->|HTTPS| B
    B -->|routes| D
    C -->|JWT validation| D
    D -->|invoke| E
    E -->|read/write| F
    E -->|enqueue| G
    G -->|poll| I
    H -.->|failed messages| I
    I -->|HTTP| J
    I -->|update| F
    I -->|send email| K
    E -->|traces| M
    I -->|traces| M
    E -->|logs| L
    I -->|logs| L
```

## Flujo Principal

### 1. Login del Seller

```
Seller → Frontend → Cognito (login)
Cognito → tokens (accessToken, refreshToken)
Frontend → almacena tokens en memoria
```

### 2. Creación de Merchant

```
Seller → Frontend → POST /merchants {ruc}
Frontend → Authorization: Bearer <token>
API Gateway → valida JWT (Cognito Authorizer)
API Gateway → Lambda createMerchant
Lambda → valida RUC (módulo 11) → sync
Lambda → DynamoDB: put merchant (status: pending_enrichment)
Lambda → SQS: sendMessage {merchantId, ruc}
Lambda → 201 {merchant, status: "pending_enrichment"}
Frontend → muestra "Enriqueciendo datos..."
```

### 3. Enriquecimiento Asíncrono

```
SQS → Lambda enricher (poll)
Lambda enricher → SUNAT Mock (delay 1-5s, simula latencia real)
Lambda enricher → DynamoDB: update merchant (status: ready_to_submit)
Lambda enricher → SES: send email "Datos listos"
Lambda enricher → SQS: deleteMessage
```

> **Nota**: La API de SUNAT se encuentra mockeada con un delay de 1-5 segundos para simular la latencia real de la API de SUNAT. En producción, se conectaría a la API real de SUNAT.

### 4. Confirmación del Seller

```
Seller → Frontend → ve merchant enriquecido
Seller → Frontend → PUT /merchants/:id {status: "submitted"}
Lambda → verifica sellerId del JWT === merchant.sellerId
Lambda → actualiza status: submitted
Lambda → respuesta 200 OK
```

## Servicios AWS Utilizados

| Servicio       | Uso                       | Justificación                       |
| -------------- | ------------------------- | ----------------------------------- |
| CloudFront     | CDN, cache, WAF           | Velocidad global, seguridad en edge |
| S3             | Hosting frontend estático | Costo mínimo, alta disponibilidad   |
| Cognito        | Autenticación             | JWT nativo, MFA, social login       |
| API Gateway v2 | HTTP API + routing        | Integración nativa Lambda + Cognito |
| Lambda         | Compute serverless        | Auto-scale, pay-per-request         |
| DynamoDB       | Base de datos             | NoSQL, escalable, GSIs              |
| SQS            | Cola de mensajes          | Desacoplamiento, DLQ, reintentos    |
| SES            | Email transaccional       | Barato, nativo AWS                  |
| CloudWatch     | Logs y métricas           | Observabilidad nativa               |
| X-Ray          | Tracing distribuido       | Visibilidad end-to-end              |
| WAF            | Web Application Firewall  | Protección OWASP Top 10             |

## ¿Por qué Serverless?

**Toda la arquitectura es serverless.** No hay un solo servidor que administrar.

| Capa      | Servicio Serverless  | Alternativa no-serverless (descartada) |
| --------- | -------------------- | -------------------------------------- |
| Compute   | Lambda               | EC2 ($70+/mes)                         |
| API       | API Gateway v2       | ALB + EC2 ($86+/mes)                   |
| Database  | DynamoDB (on-demand) | RDS ($15+/mes)                         |
| Messaging | SQS                  | RabbitMQ en EC2                        |
| Auth      | Cognito              | Keycloak en EC2                        |
| Hosting   | S3 + CloudFront      | Nginx en EC2                           |
| Email     | SES                  | SMTP en servidor                       |

### Comparación de costos

```
Serverless (nuestro caso):
  Lambda:      $2.50/mes  (10K requests)
  DynamoDB:    $0.04/mes  (on-demand)
  API Gateway: $0.01/mes  (10K requests)
  SQS:         $0.0002/mes
  Cognito:     $0.55/mes  (100 MAU)
  SES:         $0.05/mes  (500 emails)
  WAF:         $15.00/mes
  TOTAL:       ~$18/mes

No-serverless equivalente:
  EC2 t3.micro:  $70/mes (24/7)
  RDS t3.micro:  $15/mes (24/7)
  ALB:           $16/mes (mínimo)
  TOTAL:         ~$101/mes
```

**Ahorro: ~82% con serverless.**

### Trade-offs aceptados

| Aspecto        | Serverless              | No-serverless   |
| -------------- | ----------------------- | --------------- |
| Cold starts    | 200ms-1s                | Sin cold starts |
| Vendor lock-in | SDK AWS                 | Portable        |
| Limits         | 15min timeout, 10GB RAM | Sin limits      |
| Debugging      | X-Ray + CloudWatch      | SSH al servidor |

**Decisión**: Los cold starts son aceptables — el seller no notará 200ms extra. Si escalamos a 10K+ requests/hora, reconsideraríamos.

Ver [ADR-007: Serverless](adr/007-serverless-architecture.md) para el análisis completo.

## Decisiones Clave de Arquitectura

1. **100% Serverless**: Zero ops, pago por uso, auto-scale automático.

1. **Single-table DynamoDB**: Una sola tabla con GSIs para todos los access patterns. Evita joins y reduce latency.

1. **SQS Standard (no FIFO)**: No necesitamos ordering por merchant. Standard es más barato y tiene mejor throughput.

1. **Lambda synchronous + async**: El createMerchant es síncrono (respuesta inmediata). El enricher es asíncrono (background).

1. **Cognito Authorizer en API Gateway**: La validación JWT ocurre en edge, no en Lambda. Reduce cold starts.

1. **Static frontend**: NextJS exporta HTML. No hay servidor. S3 + CloudFront. Costo mínimo.

1. **FLOCI para desarrollo**: LocalStack está sunset. FLOCI es más rápido y siempre free.

## Blast Radius

| Escenario     | Impacto                            | Mitigación                              |
| ------------- | ---------------------------------- | --------------------------------------- |
| DynamoDB cae  | No se crean ni leen merchants      | DynamoDB replicas automáticas           |
| SQS cae       | No se enriquecen merchants         | DLQ retiene mensajes, retry manual      |
| SUNAT API cae | Enrichment falla, retry automático | Mock con delay, MaxReceiveCount: 3, DLQ |
| SES cae       | No se envían emails                | Retry automático, fallback a console    |
| Lambda falla  | Request falla                      | API Gateway retry, DLQ para async       |
| Cognito cae   | No se puede login                  | Multi-region si es crítico              |
