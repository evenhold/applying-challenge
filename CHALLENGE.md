# Caso de Evaluación — Arquitecto / Full Stack AWS-Native

> **Documento con dos partes.** La **Parte A** se entrega al candidato. La **Parte B (Rúbrica y banco de preguntas)** es de uso interno del evaluador. **No compartir la Parte B con el candidato.**

---

## Parte A — Enunciado para el candidato

### Contexto de esta evaluación

No estamos buscando a alguien que escriba código rápido. Escribir código hoy lo hace cualquiera con una IA al lado. Lo que evaluamos es tu **criterio para diseñar soluciones nativas en AWS**: qué eliges, qué descartas, qué anticipas que va a fallar y cómo lo defiendes.

Por eso **puedes (y debes) usar la IA y las herramientas que quieras** — Claude, Cursor, Kiro, Copilot, lo que uses en tu día a día. No penalizamos el uso de IA; penalizamos no entender lo que la IA produjo. La condición es simple: **todo lo que entregues, lo tienes que poder defender.**

### El reto

Diseña la arquitectura de una aplicación web sobre AWS. **Tú eliges el dominio del problema.** Algunos ejemplos, por si ayuda a arrancar (no es obligatorio usar uno de estos):

- Plataforma de gestión y seguimiento de tickets de soporte.
- Procesamiento de órdenes de un e-commerce (checkout → validación → fulfillment).
- Ingesta y procesamiento asíncrono de documentos (carga → OCR/validación → notificación).
- Sistema de notificaciones multicanal (email / SMS / push) con reintentos.
- Plataforma de reservas con control de disponibilidad.

Elige algo que te permita mostrar decisiones interesantes. Un CRUD plano no da para mucho.

### Escenario base (obligatorio, sea cual sea el dominio)

Sin importar el caso que elijas, tu solución debe incluir:

1. **Frontend Angular** servido de forma estática vía **CloudFront + S3**.
2. **API** expuesta por **API Gateway + Lambda** (backend en **Node.js**).
3. **Persistencia en DynamoDB**.
4. Al menos **un flujo asíncrono desacoplado con SQS** (ejemplo: la acción del usuario dispara un procesamiento en segundo plano).
5. **Autenticación y autorización** de usuarios.

Este stack es el **punto de partida**. Si en tu diseño consideras que algún servicio no es la mejor opción para un requisito concreto, **cámbialo y justifícalo**. Cuestionar el stack con argumentos sólidos suma, no resta.

### Requisitos no funcionales que debes abordar

Estos son los que de verdad nos interesan. No hace falta implementarlos todos en código; sí necesitamos ver que los **diseñaste con criterio** y que sabes por qué.

**Seguridad**

- Cómo abordas el **OWASP Top 10** en tu arquitectura concreta (no la lista genérica: dónde aplica y dónde no aplica en _tu_ diseño, y por qué).
- Prácticas de **desarrollo seguro** en el ciclo de vida (manejo de secretos, validación de entrada, dependencias, least privilege en IAM).
- Tu solución **va a ser sometida a pen testing**. ¿Qué consideraciones tomas para que resista? ¿Qué esperarías que un pentester intente y cómo lo mitigas?

**Observabilidad**

- Logs, métricas y **trazas distribuidas** a lo largo del flujo (front → API → Lambda → SQS → consumidor → DynamoDB).
- Qué **alarmas** definirías y sobre qué señales.
- Qué **SLOs / SLIs** tienen sentido para tu caso.

**Resiliencia y manejo de fallas**

- Qué pasa cuando el procesamiento asíncrono falla: **DLQ**, reintentos, **idempotencia**, poison messages.
- Radio de impacto (_blast radius_) ante una falla o una compromisión.

**Costos**

- Estimación gruesa y qué palancas de costo tiene tu arquitectura. Dónde escalaría feo el gasto y cómo lo controlas.

Puedes agregar cualquier otra dimensión que consideres relevante para tu caso (multi-tenancy, escalabilidad, cumplimiento, etc.). La iniciativa de proponer lo que no te pedimos pero el sistema necesita es exactamente lo que buscamos.

### Entregables

1. **Diagrama de arquitectura** (la herramienta que quieras).
2. **Documento de diseño** que explique el problema elegido, las decisiones clave y sus trade-offs. Recomendamos formato de **ADRs** (Architecture Decision Records) para las decisiones importantes: qué decidiste, qué alternativas evaluaste, por qué esa.
3. **Lo que quieras mostrar en código**: no es obligatorio implementar todo. Un fragmento bien pensado (ej. la Lambda con su manejo de idempotencia, la política IAM, el diseño de tabla DynamoDB con sus access patterns) vale más que un repo entero copiado.
4. **Nota de uso de IA**: qué herramienta usaste y 3-5 de los prompts o decisiones donde la IA te ayudó — y dónde le corregiste o descartaste lo que propuso.

### Formato de la defensa

Habrá una sesión de **45-60 minutos** donde presentas tu diseño (~15 min) y respondemos preguntas. Ahí es donde de verdad se evalúa. Prepárate para justificar cada decisión y para escenarios del tipo _"y si en producción pasa X, ¿qué haces?"_.

---
