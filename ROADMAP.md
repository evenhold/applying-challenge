# Roadmap — Mini Onboarding

## Fase 0: Fundamentos ✅

- [x] Docker Compose (frontend, backend, FLOCI)
- [x] Dockerfiles multi-stage
- [x] FLOCI (AWS local emulator) funcionando
- [x] Hot-reload con compose.override.yml
- [x] Fix pnpm v11 (allowBuilds en pnpm-workspace.yaml)

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

## Fase 4: API Handlers ⏳

- [ ] `POST /merchants` — Crear merchant (validar RUC → SQS)
- [ ] `GET /merchants` — Listar merchants del seller
- [ ] `GET /merchants/:id` — Obtener merchant por ID
- [ ] `PUT /merchants/:id` — Actualizar merchant (status, confirmar, etc.)
- [ ] Input validation con schema (Zod)
- [ ] Error handling consistente
- [ ] Authorization server-side (sellerId del JWT === merchant.sellerId)

## Fase 5: Lambda Enricher ⏳

- [ ] SQS consumer para enrichment
- [ ] SUNAT Mock (delay 1-5s, devuelve datos fake)
- [ ] Actualización de DynamoDB tras enrichment
- [ ] Envío de email vía SES
- [ ] Manejo de DLQ

## Fase 6: Auth (Cognito) ⏳

- [ ] Configuración de Cognito User Pool
- [ ] API Gateway JWT Authorizer
- [ ] Login en frontend
- [ ] Protección de rutas

## Fase 7: DynamoDB Local ⏳

- [ ] Crear tabla en FLOCI
- [ ] Configurar GSIs
- [ ] Test de access patterns

## Fase 8: Frontend - Flujo Completo ⏳

- [ ] Login page funcional
- [ ] Dashboard de merchants
- [ ] Formulario de creación de merchant
- [ ] Vista de merchant enriquecido
- [ ] Confirmación de merchant

## Fase 9: Tests Completos ⏳

- [ ] Tests unitarios de handlers
- [ ] Tests de lib (ruc-validator, dynamodb, sqs)
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

**Estado actual**: Fase 3 completada, listos para Fase 4 (API Handlers)
