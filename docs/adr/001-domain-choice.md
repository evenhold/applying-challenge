# ADR-001: Elección de Dominio — Mini Onboarding

## Estado

Aprobado

## Contexto

La evaluación pide diseñar una arquitectura AWS-native para un dominio a elegir. El dominio debe permitir mostrar decisiones técnicas interesantes — un CRUD plano no alcanza.

## Decisión

**Mini Onboarding** — plataforma para afiliar nuevos comercios (merchants) a una pasarela de pagos estilo Culqi.

### Flujo principal

1. Un seller (vendedor) inicia sesión
2. Ingresa el RUC del comercio a afiliar
3. El sistema valida el RUC (algoritmo módulo 11)
4. Los datos del RUC se enriquecen de forma asíncrona (razón social, dirección, estado)
5. El seller revisa los datos enriquecidos
6. Confirma y envía la solicitud de afiliación

### Por qué este dominio

- **Flujo asíncrono natural**: La validación del RUC contra SUNAT no puede ser síncrona (latencia variable). Perfecto para SQS.
- **Múltiples estados**: pending_enrichment → enriching → ready_to_submit → submitted → approved/rejected. Demuestra manejo de estado en DynamoDB.
- **Autenticación real**: Los sellers necesitan login (Cognito).
- **Validación de entrada**: RUC peruano tiene algoritmo específico (módulo 11). Demuestra validación server-side.
- **Notificación**: Tras enriquecimiento, se notifica al seller vía email (SES).

## Alternativas evaluadas

| Dominio                   | Pros                    | Contras                        | Por qué no                         |
| ------------------------- | ----------------------- | ------------------------------ | ---------------------------------- |
| Tickets de soporte        | Común, bien entendido   | Demasiado CRUD, poco asíncrono | No muestra decisiones interesantes |
| E-commerce checkout       | Flujos ricos            | Muy complejo para el tiempo    | scope creep alto                   |
| Notificaciones multicanal | SQS + SNS               | Poco dominio de negocio        | Solo infra, poco código de negocio |
| Reservas                  | Control de concurrencia | Complejidad de booking         | No aplica SQS naturalmente         |

## Consecuencias

- El flujo RUC → SQS → enriquecimiento → notificación cubre todos los requisitos del challenge
- El dominio peruano (RUC) da contexto real y justifica validación específica
- Permite demostrar ADRs concretos sobre cada capa de la arquitectura
