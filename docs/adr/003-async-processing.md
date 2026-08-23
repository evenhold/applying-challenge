# ADR-003: Procesamiento Asíncrono — SQS

## Estado

Aprobado

## Contexto

El challenge requiere "al menos un flujo asíncrono desacoplado con SQS". En nuestro dominio, la validación del RUC contra SUNAT es naturalmente asíncrona:

- SUNAT puede tardar 1-5 segundos en responder
- No queremos bloquear al seller mientras se enriquecen los datos
- Si SUNAT cae, no queremos perder la solicitud

## Decisión

**Amazon SQS (Standard queue)** para el flujo de enriquecimiento de RUC.

### Flujo

```
1. Lambda createMerchant recibe RUC del seller
2. Valida RUC (módulo 11) → sync, rápido
3. Crea merchant en DynamoDB (status: pending_enrichment)
4. Envía mensaje a SQS: {merchantId, ruc}
5. Return 201 al seller (no espera enriquecimiento)

--- asynchronously ---

6. Lambda enricher consume de SQS
7. Consulta SUNAT API (o servicio externo)
8. Actualiza DynamoDB con datos enriquecidos
9. Envía email de confirmación vía SES
```

### Configuración SQS

- **Cola principal**: `merchants-enrichment`
- **DLQ**: `merchants-enrichment-dlq` (maxReceiveCount: 3)
- **Visibility timeout**: 30s (tiempo suficiente para enrichment)
- **Message retention**: 4 días
- **Batch size**: 1 (para retry granular)

## Alternativas evaluadas

| Servicio       | Pros                           | Contras                        | Decisión    |
| -------------- | ------------------------------ | ------------------------------ | ----------- |
| SQS            | Simple, DLQ nativo, reintentos | Sin ordering guarantees        | **Elegido** |
| SNS → SQS      | Fan-out possible               | Overkill para un consumer      | No          |
| EventBridge    | Schema registry, rules         | Más caro, más complejo         | No          |
| Step Functions | Visual workflow                | Costo por transición, overkill | No          |
| Lambda async   | Retry automático               | Sin DLQ visible, sin control   | No          |

## Consecuencias

- SQS Standard es suficiente: no necesitamos ordering por merchant
- DLQ captura mensajes fallidos para inspección manual
- El seller no espera:回复 inmediata + enriquecimiento background
- Si SQS falla, el merchant queda en `pending_enrichment` — el seller puede reintentar
