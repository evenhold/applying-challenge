# Observabilidad — Mini Onboarding

## Stack de Observabilidad

```
Frontend → CloudFront access logs
API Gateway → access logs → CloudWatch
Lambda → structured logs → CloudWatch
Lambda → traces → X-Ray
DynamoDB → CloudTrail + metrics
SQS → metrics → CloudWatch
SES → delivery logs → CloudWatch
```

## Logs

### Estructura de log (Lambda)

```json
{
  "timestamp": "2026-08-22T10:00:00.000Z",
  "level": "INFO",
  "service": "create-merchant",
  "traceId": "Root=1-xxx;Parent=xxx;Sampled=1",
  "sellerId": "seller-456",
  "merchantId": "MERCHANT#abc-123",
  "action": "merchant_created",
  "ruc": "20123456789",
  "duration": 45
}
```

### Logs de error

```json
{
  "timestamp": "2026-08-22T10:00:00.000Z",
  "level": "ERROR",
  "service": "enrich-merchant",
  "traceId": "Root=1-xxx",
  "merchantId": "MERCHANT#abc-123",
  "error": "SUNAT API timeout",
  "attempt": 2,
  "maxAttempts": 3
}
```

### CloudWatch Insights Queries

```sql
-- Errores en las últimas 24h
fields @timestamp, @message
| filter level = "ERROR"
| sort @timestamp desc
| limit 50

-- Latencia de Lambda
fields @timestamp, @duration
| filter service = "create-merchant"
| stats avg(@duration), max(@duration), p99(@duration) by service

-- Merchants creados por hora
fields @timestamp
| filter action = "merchant_created"
| stats count(*) by bin(1h)
```

## Métricas

### Métricas de negocio

| Métrica | Descripción | Alarmar si |
|---------|-------------|------------|
| MerchantsCreatedHour | Creados por hora | < 1 (posible caída) |
| EnrichmentSuccessRate | % enriquecimientos exitosos | < 95% |
| EnrichmentDuration | Tiempo promedio de enrichment | > 10s |
| SQSApproximateAgeOfOldestMessage | Antigüedad del mensaje más viejo | > 5min |

### Métricas de sistema

| Métrica | Descripción | Alarmar si |
|---------|-------------|------------|
| LambdaErrors | Errores por lambda | > 5 en 5min |
| LambdaDuration | Duración promedio | > 80% del timeout |
| LambdaThrottles | Throttles | > 0 |
| DynamoDBReadThrottleEvents | Read throttles | > 0 |
| DynamoDBWriteThrottleEvents | Write throttles | > 0 |
| SQSNumberOfMessagesSent | Mensajes enviados | Anomaly detection |
| SQSNumberOfMessagesReceived | Mensajes recibidos | Anomaly detection |

## Alarmas

### Alarma 1: Lambda Errors

```
Métrica: AWS/Lambda Errors
Namespace: AWS/Lambda
Statistic: Sum
Period: 300
EvaluationPeriods: 2
Threshold: 5
ComparisonOperator: GreaterThanThreshold
AlarmAction: SNS (notificaciones)
```

### Alarma 2: SQS DLQ Messages

```
Métrica: ApproximateNumberOfMessagesVisible
Queue: merchants-enrichment-dlq
Threshold: 1
ComparisonOperator: GreaterThanOrEqualToThreshold
```

### Alarma 3: Enrichment Latency

```
Métrica: Custom/metric/enrichment-duration
Namespace: MiniOnboarding
Statistic: p99
Period: 300
Threshold: 10000 (ms)
```

### Alarma 4: API Gateway 5xx

```
Métrica: AWS/ApiGateway 5XXError
Statistic: Sum
Period: 300
Threshold: 10
```

## SLOs / SLIs

### SLO 1: Disponibilidad de la API

- **SLI**: % de requests exitosos (2xx) / total requests
- **SLO**: 99.9% (3.65 min downtime/mes)
- **Window**: Rolling 30 días

### SLO 2: Latencia de respuesta

- **SLI**: p99 latency de API Gateway
- **SLO**: < 2 segundos
- **Window**: Rolling 30 días

### SLO 3: Enrichment completion

- **SLI**: % de merchants que llegan a `ready_to_submit` dentro de 5 minutos
- **SLO**: 95%
- **Window**: Rolling 7 días

## X-Ray Tracing

### Service Map

```
Frontend → API Gateway → Lambda createMerchant → DynamoDB
                      ↘ SQS
SQS → Lambda enricher → SUNAT API
                    ↘ DynamoDB
                    ↘ SES
```

### Implementación

```typescript
// En cada Lambda
import { XRayRecorder } from 'aws-xray-sdk-core';
const segment = new XRayRecorder();

// Subsegment para cada operación
const sub = segment.addNewSubsegment('validate-ruc');
validateRuc(ruc);
sub.close();
```

## Dashboard de CloudWatch

### Widgets

1. **API Overview**: Requests, latency, errors
2. **Lambda Metrics**: Invocations, errors, duration
3. **DynamoDB Metrics**: Read/write capacity, throttles
4. **SQS Metrics**: Messages sent/received, age
5. **Business Metrics**: Merchants by status, enrichment rate
6. **Alarms Status**: Todas las alarmas y su estado
