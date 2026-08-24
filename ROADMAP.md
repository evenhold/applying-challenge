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
- [x] Páginas: `/` (landing), `/login`, `/dashboard`, `/merchants/new`, `/merchants/[id]`
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
- [x] Cost estimation (~$18/mes serverless)

## Fase 4: API Handlers ✅

- [x] `POST /merchants` — Crear merchant (validar RUC → SQS)
- [x] `GET /merchants` — Listar merchants del seller
- [x] `GET /merchants/:id` — Obtener merchant por ID
- [x] `PUT /merchants/:id` — Actualizar merchant (status, confirmar, etc.)
- [x] Input validation con Zod (createMerchantSchema, updateMerchantSchema)
- [x] Error handling consistente (ZodError → 400, NotFoundError → 404)
- [x] Authorization server-side (sellerId del JWT === merchant.sellerId)
- [x] FP Architecture: usecases/ (funciones puras input → output)
- [x] Router genérico con path params (router.ts)
- [x] Coverage 90%+ (functions: 100%, branches: 92.3%)
- [x] API routes proxy en frontend (`/api/merchants`, `/api/merchants/[id]`)

## Fase 5: Lambda Enricher ✅

- [x] SQS consumer para enrichment (`handlers/enricher.ts`)
- [x] SUNAT Mock con delay 1-5s (`lib/sunat.ts`)
- [x] Actualización de DynamoDB tras enrichment (`lib/dynamodb.ts:enrichMerchant`)
- [x] Envío de email vía SES (`lib/ses.ts`)
- [x] Manejo de DLQ (batch failures en handler)
- [x] Use case enrichMerchant (`usecases/merchants/enrich.ts`)
- [x] Tests: enricher handler (3) + enrich use case (4) = 7 tests
- [x] SQS Worker local (`src/worker.ts` — pollea SQS cada 2s, procesa mensajes)
- [x] Worker siempre borra mensajes (previene loops infinitos)

## Fase 6: Auth (Cognito) ✅

- [x] User Pool en FLOCI (`mini-onboarding-sellers`)
- [x] App Client (`mini-onboarding-web`)
- [x] Test User (`seller@test.com` / `Seller123!`)
- [x] JWT validation en backend (jose library)
- [x] Frontend auth service (`lib/auth.ts`)
- [x] AuthContext para React state
- [x] ProtectedRoute component
- [x] Login page funcional
- [x] Dashboard page con merchants
- [x] Client ID server-side only (no expuesto al cliente)
- [x] CORS fix: API route `/api/auth` como proxy a Cognito
- [ ] API Gateway JWT Authorizer (Fase 10: Terraform)

## Fase 7: DynamoDB Local ✅

- [x] Crear tabla en FLOCI (`scripts/setup-dynamodb.sh`)
- [x] Configurar GSIs (GSI1 por seller, GSI2 por estado)
- [x] Datos de prueba (`scripts/seed-data.sh` — 3 merchants)
- [x] Makefile targets: `db-setup`, `db-seed`, `db-shell`, `db-reset`
- [x] SQS queue creation en setup script
- [x] `make setup` — setup completo idempotente (Cognito + DynamoDB + SQS + seed)
- [x] `scripts/setup-all.sh` — script unificado

## Fase 8: Frontend - Flujo Completo ✅

- [x] Login page funcional (con Cognito real)
- [x] Dashboard de merchants (con botón crear + ver)
- [x] Formulario de creación de merchant (`/merchants/new`)
- [x] Vista de merchant enriquecido (`/merchants/[id]`)
- [x] Confirmación de merchant (botón submit en detail view)
- [x] ProtectedRoute component
- [x] Estilos CSS (status badges, dashboard, detail view)
- [x] Auto-polling cada 10s cuando hay estados pendientes
- [x] URL-encode de merchant IDs con `#` en links y API routes
- [x] CORS fix: API routes `/api/merchants` y `/api/merchants/[id]`

## Fase 9: Tests ✅

- [x] Tests unitarios de handlers (merchants, health, hello)
- [x] Tests de use cases (create, list, getById, update, enrich)
- [x] Tests de schemas Zod (common, merchant)
- [x] Tests de lib (ruc-validator)
- [x] Tests de router (11 tests)
- [x] Tests de enricher (handler + use case = 7 tests)
- [x] Coverage configurado (v8, 90% threshold)
- [x] Tests de integración con FLOCI (10 tests: CRUD merchants)
- [x] Tests del frontend (8 tests: auth service + 2 page tests)
- [x] Total: 84 unit + 10 frontend + 11 integration = 105 tests

## Fase 10: Terraform ✅

- [x] Decidir: 2 ambientes (dev + prod)
- [x] Módulo Cognito
- [x] Módulo DynamoDB
- [x] Módulo SQS
- [x] Módulo SES
- [x] Módulo IAM
- [x] Módulo Lambda
- [x] Módulo API Gateway
- [x] Módulo S3 + CloudFront
- [x] Módulo WAF
- [x] Módulo observability (CloudWatch, X-Ray)
- [x] Environments: dev + prod con tfvars
- [x] README con quick start, modules, variables, outputs

> **Nota**: Ver `docs/production-checklist.md` para los cambios necesarios DEV→PROD.

## Fase 11: Deploy Final 🔄

- [x] Scripts de build Lambda (esbuild → merchants.zip, enricher.zip)
- [x] Makefile targets (build-lambda, build-frontend, deploy-frontend, deploy-lambda)
- [x] Servicio infra en compose.yml (Terraform + AWS CLI via Docker)
- [x] Event Source Mapping (SQS → enricher Lambda)
- [ ] Deploy infraestructura (terraform apply)
- [ ] Deploy frontend (S3 sync + CloudFront invalidation)
- [ ] Verificar endpoints
- [ ] Verificar auth
- [ ] Verificar async flow
- [ ] Verificar email

## Fase 12: Defensa ⏳

- [ ] Preparar presentación (15 min)
- [ ] Practicar justificaciones de ADRs
- [ ] Preparar escenarios "¿y si en producción pasa X?"
- [ ] Documentar uso de IA (prompts + decisiones)

---

**Estado actual**: Fase 0-10 completadas + infra via Docker Compose + Event Source Mapping. Listo para `make infra-apply`.
