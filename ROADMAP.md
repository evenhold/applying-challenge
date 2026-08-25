# Roadmap — Mini Onboarding

## Fase 0: Fundamentos ✅

- [x] Docker Compose (frontend, backend, worker, FLOCI, awscli)
- [x] Dockerfiles multi-stage (node:24-slim)
- [x] FLOCI (AWS local emulator) con persistent mode
- [x] Hot-reload con compose.override.yml
- [x] Fix pnpm v11 (allowBuilds en pnpm-workspace.yaml)
- [x] Biome pinned to 2.5.8 (IDE compatibility)
- [x] FLOCI_HOSTNAME=floci (QueueUrl consistente)

## Fase 1: Frontend ✅

- [x] NextJS 16 con TypeScript 7
- [x] Biome (lint + format)
- [x] Vitest (tests unitarios)
- [x] SPA con useState navigation (sin router, sin CloudFront routing issues)
- [x] Docker build exitoso

## Fase 2: Backend ✅

- [x] Health check handler (`GET /health`)
- [x] Hello world handler (`GET /hello`)
- [x] Dev server local (`src/server.ts`) con JWT validation (jose)
- [x] Biome + Vitest + TypeScript
- [x] Docker build exitoso

## Fase 3: Documentación ✅

- [x] 7 ADRs (dominio, frontend, async, auth, local dev, email, serverless)
- [x] Architecture.md con diagrama Mermaid
- [x] DynamoDB design (single-table, GSIs, access patterns)
- [x] Security (OWASP Top 10 mapping)
- [x] Observability (logs, métricas, alarmas, SLOs)
- [x] Resilience (DLQ, reintentos, idempotencia)
- [x] Cost estimation (~$1.63/mes)

## Fase 4: API Handlers ✅

- [x] `POST /merchants` — Crear merchant (validar RUC → SQS)
- [x] `GET /merchants` — Listar merchants del seller
- [x] `GET /merchants/:id` — Obtener merchant por ID
- [x] `PUT /merchants/:id` — Actualizar merchant (status, confirmar, etc.)
- [x] `DELETE /merchants/:id` — Eliminar merchant
- [x] Input validation con Zod (createMerchantSchema, updateMerchantSchema)
- [x] Error handling consistente (ZodError → 400, NotFoundError → 404)
- [x] Authorization server-side (sellerId del JWT === merchant.sellerId)
- [x] FP Architecture: usecases/ (funciones puras input → output)
- [x] Router genérico con path params (router.ts)
- [x] Coverage 90%+ (functions: 100%, branches: 92.3%)

## Fase 5: Lambda Enricher ✅

- [x] SQS consumer para enrichment (`handlers/enricher.ts`)
- [x] SUNAT Mock con delay 1-5s (`lib/sunat.ts`)
- [x] Actualización de DynamoDB tras enrichment (`lib/dynamodb.ts:enrichMerchant`)
- [x] Envío de email vía SES (`lib/ses.ts`)
- [x] Manejo de DLQ (batch failures en handler)
- [x] Use case enrichMerchant (`usecases/merchants/enrich.ts`)
- [x] SQS Worker local (`src/worker.ts` — pollea SQS cada 2s, procesa mensajes)
- [x] Worker siempre borra mensajes (previene loops infinitos)
- [x] QueueDoesNotExist handling (retry cada 10s)

## Fase 6: Auth (Cognito) ✅

- [x] User Pool en FLOCI (`mini-onboarding-sellers`)
- [x] App Client (`mini-onboarding-web`)
- [x] Test User (`seller@test.com` / `Seller123!`)
- [x] JWT validation en backend (jose library)
- [x] Frontend auth service (`lib/auth.ts`) — Cognito API directa
- [x] AuthContext para React state
- [x] ProtectedRoute component
- [x] Login page funcional
- [x] Dashboard page con merchants
- [x] Client ID server-side only (no expuesto al cliente)
- [x] CORS fix: API route proxy para FLOCI
- [x] API Gateway JWT Authorizer en AWS

## Fase 7: DynamoDB Local ✅

- [x] Crear tabla en FLOCI (`scripts/setup-dynamodb.sh`)
- [x] Configurar GSIs (GSI1 por seller, GSI2 por estado)
- [x] Datos de prueba (`scripts/seed-data.sh`)
- [x] Makefile targets: `db-setup`, `db-seed`, `db-shell`, `db-reset`
- [x] SQS queue creation en setup script
- [x] `make setup` — setup completo idempotente

## Fase 8: Frontend - Flujo Completo ✅

- [x] Login page funcional (con Cognito real)
- [x] Dashboard de merchants (con botón crear + ver + eliminar)
- [x] Formulario de creación de merchant
- [x] Vista de merchant enriquecido con timestamps
- [x] Confirmación de merchant
- [x] Eliminación de merchant (icono tacho, sin confirmación)
- [x] Auto-polling cada 10s cuando hay estados pendientes
- [x] Orden descendente por fecha de creación
- [x] URL-encode de merchant IDs con `#`

## Fase 9: Tests ✅

- [x] Tests unitarios de handlers (merchants, health, hello)
- [x] Tests de use cases (create, list, getById, update, enrich)
- [x] Tests de schemas Zod
- [x] Tests de lib (ruc-validator)
- [x] Tests de router
- [x] Tests de enricher (handler + use case)
- [x] Tests de integración con FLOCI (CRUD merchants)
- [x] Tests del frontend (auth service + page tests)
- [x] Separación unit vs integration tests

## Fase 10: Terraform ✅

- [x] 2 ambientes (dev + prod) con environments/
- [x] 10 módulos: Cognito, DynamoDB, SQS, SES, IAM, Lambda, API Gateway, S3+CloudFront, WAF, Observability
- [x] Event Source Mapping (SQS → enricher Lambda)
- [x] 43 recursos AWS desplegados

## Fase 11: Deploy AWS ✅

### Build & Deploy
- [x] Scripts de build Lambda (esbuild → merchants.zip, enricher.zip)
- [x] Build frontend (Docker + docker create/start/cp)
- [x] Deploy frontend (S3 sync + CloudFront invalidation via Docker Compose)
- [x] Separación .env.local (LOCAL) / .env.production (AWS)
- [x] Makefile: LOCAL usa .env.local, PROD usa .env.production

### Infraestructura desplegada
- [x] Cognito User Pool + Client + Hosted UI
- [x] DynamoDB table + 2 GSIs (on-demand)
- [x] SQS queue + DLQ + Event Source Mapping
- [x] Lambda merchants (128MB, nodejs22.x)
- [x] Lambda enricher (256MB, nodejs22.x, sin pino)
- [x] API Gateway HTTP API v2 + Cognito Authorizer + 6 routes
- [x] S3 bucket + CloudFront distribution
- [x] CloudWatch logs (7d) + alarm + dashboard
- [x] X-Ray tracing

### Funcionalidad verificada
- [x] GET /health → 200 OK
- [x] Login con Cognito real → JWT token
- [x] GET /merchants → lista merchants
- [x] POST /merchants → crear merchant → SQS → enricher → DynamoDB
- [x] GET /merchants/:id → detalle merchant con timestamps
- [x] PUT /merchants/:id → actualizar merchant
- [x] DELETE /merchants/:id → eliminar merchant
- [x] Enricher Lambda procesa mensajes (1.8s, console.log)

### Seguridad
- [x] CSP headers via CloudFront response policy
- [x] HSTS + X-Frame-Options + X-XSS-Protection + Referrer-Policy
- [x] OWASP Top 10: 10/10 cubiertos (sin WAF)
- [x] Least-privilege IAM (roles separados merchants/enricher)
- [x] DynamoDB + S3 encryption at rest

### Pendientes menores
- [ ] Verificar SES email (sandbox mode, necesita verificación)
- [ ] Refresh tokens (tokens expiran en 1h, sin refresh flow)
- [ ] Tests actualizados para DELETE endpoint

## Fase 12: Defensa ⏳

- [ ] Preparar presentación (15 min)
- [ ] Practicar justificaciones de ADRs
- [ ] Preparar escenarios "¿y si en producción pasa X?"
- [ ] Documentar uso de IA (prompts + decisiones)

---

**Estado actual**: Fase 0-11 completadas. App desplegada en AWS.
- Frontend: https://d1vazin5v6ecqg.cloudfront.net
- API: https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com
- Costo: ~$1.63/mes (sin WAF) / ~$0 con Free Tier (12 meses)
- OWASP: 10/10 cubiertos
- Recursos: 43 Terraform, 11 servicios AWS
