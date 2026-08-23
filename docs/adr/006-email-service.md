# ADR-006: Servicio de Email — SES

## Estado

Aprobado

## Contexto

El flujo de enriquecimiento necesita notificar al seller cuando sus datos están listos. El challenge pide al menos un flujo asíncrono con SQS — el email es la notificación natural.

## Decisión

**Amazon SES** para envío de emails transaccionales.

### Casos de uso

1. **Enriquecimiento completado**: "Tu merchant <razonSocial> está listo para submit"
2. **Merchant aprobado**: "Tu solicitud de afiliación fue aprobada"
3. **Merchant rechazado**: "Tu solicitud fue rechazado. Motivo: ..."

### Configuración

- **Remitente**: `noreply@mini-onboarding.local` (desarrollo)
- **Producción**: dominio verificado en SES
- **Modo sandbox**: Para desarrollo (solo emails verificados)
- **Modo producción**: Para envío real (solicitud de acceso a AWS)

### Integración con SQS

```
Lambda Enricher:
  1. Actualiza DynamoDB (status: ready_to_submit)
  2. Envía email vía SES
  3. Confirma mensaje SQS (deleteMessage)
```

## Alternativas evaluadas

| Servicio | Pros                                              | Contras                              | Decisión    |
| -------- | ------------------------------------------------- | ------------------------------------ | ----------- |
| SES      | Barato ($0.10/1000 emails), nativo AWS, templates | Sandbox mode por defecto             | **Elegido** |
| SNS      | Multicanal (email+SMS+push)                       | Overkill para solo email, más caro   | No          |
| SendGrid | Features ricas, API moderna                       | Costo adicional, external dependency | No          |
| Mailgun  | Simple, buen DX (experiencia de desarrollo)  | External dependency                  | No          |

## Consecuencias

- SES es ~10x más barato que SNS para email puro
- Sandbox mode: solo envía a emails verificados (ideal para desarrollo)
- Producción requiere solicitud a AWS (1-2 días)
- Templates de email se pueden usar con SES HTML templates
- Los logs de envío quedan en CloudWatch para debugging
