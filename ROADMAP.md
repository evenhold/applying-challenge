# Roadmap — Mini Onboarding

## Fase 0: Fundamentos ✅

- [x] Docker Compose (frontend, backend, FLOCI)
- [x] Dockerfiles multi-stage
- [x] FLOCI (AWS local emulator) funcionando
- [x] Hot-reload con compose.override.yml
- [x] Fix pnpm v11 (allowBuilds en pnpm-workspace.yaml)
- [x] Docker base image: node:24-slim (glibc)
- [x] Biome pinned to 2.5.8 (IDE compatibility)

## Fase 1: Frontend ✅

- [x] NextJS 16 con TypeScript 7
- [x] Biome (lint + format)
- [x] Vitest (tests unitarios)
- [x] Páginas básicas: `/` (landing), `/login` (placeholder)
- [x] Build estático (`output: 'export'`)
- [x] Docker build exitoso

## Fase 2: Backend ✅

- [x] Health check handler (`GET /health`)
- [x] Hello world handler (`GET /hello`)
- [x] Dev server local (`src/server.ts`)
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

## Fase 5: Lambda Enricher ✅

- [x] SQS consumer para enrichment (`handlers/enricher.ts`)
- [x] SUNAT Mock con delay 1-5s (`lib/sunat.ts`)
- [x] Actualización de DynamoDB tras enrichment (`lib/dynamodb.ts:enrichMerchant`)
- [x] Envío de email vía SES (`lib/ses.ts`)
- [x] Manejo de DLQ (batch failures en handler)
- [x] Use case enrichMerchant (`usecases/merchants/enrich.ts`)
- [x] Tests: enricher handler (3) + enrich use case (4) = 7 tests

## Fase 6: Auth (Cognito) 🔄

- [x] User Pool en FLOCI (`mini-onboarding-sellers`)
- [x] App Client (`mini-onboarding-web`)
- [x] Test User (`seller@test.com` / `Seller123!`)
- [x] JWT validation en backend (jose library)
- [x] Frontend auth service (`lib/auth.ts`)
- [x] AuthContext para React state
- [x] ProtectedRoute component
- [x] Login page funcional
- [x] Dashboard page con merchants
- [ ] API Gateway JWT Authorizer (Fase 10: Terraform)

## Fase 7: DynamoDB Local ✅

- [x] Crear tabla en FLOCI (`scripts/setup-dynamodb.sh`)
- [x] Configurar GSIs (GSI1 por seller, GSI2 por estado)
- [x] Datos de prueba (`scripts/seed-data.sh` — 3 merchants)
- [x] Makefile targets: `db-setup`, `db-seed`, `db-shell`, `db-reset`

## Fase 8: Frontend - Flujo Completo ✅

- [x] Login page funcional (con Cognito real)
- [x] Dashboard de merchants (con botón crear + ver)
- [x] Formulario de creación de merchant (`/merchants/new`)
- [x] Vista de merchant enriquecido (`/merchants/[id]`)
- [x] Confirmación de merchant (botón submit en detail view)
- [x] ProtectedRoute component
- [x] Estilos CSS (status badges, dashboard, detail view)

## Fase 9: Tests 🔄

- [x] Tests unitarios de handlers (merchants, health, hello)
- [x] Tests de use cases (create, list, getById, update, enrich)
- [x] Tests de schemas Zod (common, merchant)
- [x] Tests de lib (ruc-validator)
- [x] Tests de router (11 tests)
- [x] Tests de enricher (handler + use case = 7 tests)
- [x] Coverage configurado (v8, 90% threshold)
- [ ] Tests de integración con FLOCI
- [ ] Tests del frontend (componentes)

## Fase 10: Terraform ⏳

- [ ] Módulo DynamoDB
- [ ] Módulo Lambda
- [ ] Módulo API Gateway
- [ ] Módulo Cognito
- [ ] Módulo SQS
- [ ] Módulo SES
- [ ] Módulo S3 + CloudFront
- [ ] Módulo WAF
- [ ] Módulo observability (CloudWatch, X-Ray)

## Fase 11: Deploy Final ⏳

- [ ] Deploy a AWS real
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

**Estado actual**: Fase 4, 5, 6, 7, 8 completadas. Fase 9 en progreso (84 tests unitarios). Siguiente: Fase 9 (Tests de integración) o Fase 10 (Terraform).
