# Resiliencia — Mini Onboarding

## Estrategia General

El sistema está diseñado para fallar de forma controlada. Ningún componente es crítico al punto de perder datos permanentemente.

## DLQ (Dead Letter Queue)

### Configuración

```
Cola principal: merchants-enrichment
DLQ: merchants-enrichment-dlq
maxReceiveCount: 3 (reintentos antes de DLQ)
messageRetentionPeriod: 4 días (1209600 seconds)
```

### Flujo de falla

```
1. Lambda enricher falla al procesar mensaje
2. SQS hace visible el mensaje nuevamente (visibility timeout)
3. Lambda intenta de nuevo (intento 2)
4. Si falla, intento 3
5. Si falla el tercer intento → DLQ
6. Mensaje queda en DLQ para inspección manual
```

### Inspección de DLQ

```bash
# Ver mensajes en DLQ
aws sqs receive-message --queue-url <dlq-url>

# Reintentar mensaje desde DLQ
aws sqs send-message --queue-url <main-queue-url> --message-body <body>
```

## Reintentos

### Lambda Async (createMerchant)

- **Retry automático**: 2 intentos
- **On failure**: Destino configurado (DLQ o otro servicio)
- **Timeout**: 10 segundos

### Lambda Sync (enricher via SQS)

- **SQS retry**: maxReceiveCount = 3
- **Visibility timeout**: 30 segundos entre reintentos
- **DLQ**: Mensajes fallidos van a merchants-enrichment-dlq

### HTTP a SUNAT API

- **Timeout**: 5 segundos
- **Retry**: No automático (SQS maneja reintentos)
- **Backoff**: SQS visibility timeout incrementa automáticamente

## Idempotencia

### createMerchant (Lambda)

```typescript
// Usar idempotency key (RUC + sellerId)
const idempotencyKey = `${sellerId}:${ruc}`

// Verificar si ya existe un merchant con este RUC para este seller
const existing = await getMerchantsBySeller(sellerId)
const duplicate = existing.find(m => m.ruc === ruc)

if (duplicate) {
  return { statusCode: 409, body: 'Merchant already exists' }
}

// Crear merchant con ID único
const merchant = await createMerchant({ ruc, sellerId })
```

### enricher (Lambda + SQS)

```typescript
// Usar merchantId como idempotency key
// Si el merchant ya está enready_to_submit, no re-procesar
const merchant = await getMerchant(merchantId)
if (merchant.status === 'ready_to_submit') {
  // Ya procesado, ignorar mensaje
  await sqs.deleteMessage(message)
  return
}

// Procesar enrichment
await enrichMerchant(merchantId, ruc)
```

## Poison Messages

### Detección

```typescript
// En el enricher
const body = JSON.parse(message.Body)
if (!body.merchantId || !body.ruc) {
  // Mensaje malformado → no reintentar, enviar a DLQ inmediatamente
  await sqs.changeMessageVisibility({
    QueueUrl: queueUrl,
    ReceiptHandle: message.ReceiptHandle,
    VisibilityTimeout: 0  // Hacer visible inmediatamente para que SQS lo mueva a DLQ
  })
  return
}
```

### Validación de schema

```typescript
// Validar estructura del mensaje antes de procesar
function validateMessage(body: unknown): body is EnrichmentMessage {
  return (
    typeof body === 'object' &&
    body !== null &&
    'merchantId' in body &&
    'ruc' in body &&
    typeof (body as any).merchantId === 'string' &&
    typeof (body as any).ruc === 'string' &&
    /^\d{11}$/.test((body as any).ruc)
  )
}
```

## Timeout Handling

| Componente | Timeout | Acción en timeout |
|-----------|---------|-------------------|
| API Gateway | 29 segundos | 504 Gateway Timeout |
| Lambda createMerchant | 10 segundos | Retry automático |
| Lambda enricher | 30 segundos | SQS retry → DLQ |
| HTTP SUNAT API | 5 segundos | Error → SQS retry |
| DynamoDB | 5 segundos (default) | Excepción → Lambda retry |

## Circuit Breaker (Opcional)

Para proteger contra SUNAT API caído:

```typescript
let failureCount = 0
const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_RESET = 60000 // 1 minuto
let lastFailureTime = 0

async function callSunatWithCircuitBreaker(ruc: string) {
  if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    if (Date.now() - lastFailureTime < CIRCUIT_BREAKER_RESET) {
      throw new Error('Circuit breaker open - SUNAT API unavailable')
    }
    failureCount = 0 // Reset after cooldown
  }

  try {
    const result = await callSunatApi(ruc)
    failureCount = 0
    return result
  } catch (error) {
    failureCount++
    lastFailureTime = Date.now()
    throw error
  }
}
```

## Blast Radius por Componente

| Componente | Falla | Impacto | Datos perdidos |
|-----------|-------|---------|----------------|
| DynamoDB | Caída total | No se crean/leen merchants | No (SQS retiene mensajes) |
| SQS | Caída | No se enriquecen merchants | No (messages persist in queue) |
| SUNAT API | Caída | Enrichment falla, retry automático | No (DLQ retiene) |
| SES | Caída | No se envían emails | No (retry automático) |
| Cognito | Caída | No se puede login | No (users exist in pool) |
| Lambda | Caída | Requests fallan | No (SQS retries) |

## Recovery Procedures

### DynamoDB restore
```bash
# Point-in-time recovery (si está habilitado)
aws dynamodb restore-table-to-point-in-time \
  --source-table-name merchants \
  --target-table-name merchants-restored \
  --use-latest-restorable-time
```

### DLQ replay
```bash
# Mover mensajes de DLQ de vuelta a la cola principal
aws sqs receive-message --queue-url <dlq-url> --max-number-of-messages 10
# Para cada mensaje, reenviar a la cola principal
```

### Lambda cold start mitigation
- Provisioned concurrency para Lambda críticas
- Minimo 2 instancias provisionadas
- Auto-scaling basado en invocation count
