.PHONY: help dev dev-frontend dev-backend dev-floci \
       test test-unit test-integration test-e2e \
       setup db-setup db-seed db-shell db-reset \
       cognito-setup \
       build-lambda build-frontend \
       infra-init infra-plan infra-apply infra-destroy infra-validate \
       deploy-frontend deploy-lambda \
       logs shell-frontend shell-backend floci-health clean

# ==============================================================================
# DESARROLLO LOCAL — usa .env.local (FLOCI)
# ==============================================================================

help: ## Mostrar esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Levantar todo con docker compose
	docker compose --env-file .env.local up

dev-frontend: ## Levantar solo frontend
	docker compose --env-file .env.local up frontend

dev-backend: ## Levantar solo backend
	docker compose --env-file .env.local up backend

dev-floci: ## Levantar solo FLOCI
	docker compose --env-file .env.local up floci

# ==============================================================================
# TESTS (LOCAL)
# ==============================================================================

test: ## Ejecutar todos los tests
	docker compose --env-file .env.local run --rm backend pnpm test

test-unit: ## Ejecutar solo unit tests
	docker compose --env-file .env.local run --rm backend pnpm test:unit

test-integration: ## Ejecutar integration tests (requiere backend corriendo)
	docker compose --env-file .env.local exec backend pnpm test:integration

test-frontend: ## Ejecutar tests del frontend
	docker compose --env-file .env.local run --rm frontend pnpm test

test-e2e: ## Ejecutar solo e2e tests
	docker compose --env-file .env.local exec backend pnpm test:e2e

# ==============================================================================
# BASE DE DATOS (LOCAL — FLOCI)
# ==============================================================================

db-setup: ## Crear tabla merchants + GSIs en FLOCI
	bash scripts/setup-dynamodb.sh

db-seed: ## Insertar merchants de prueba en FLOCI
	bash scripts/seed-data.sh

db-shell: ## Ver todos los merchants (scan)
	@docker compose --env-file .env.local run --rm awscli dynamodb scan \
		--table-name merchants \
		--endpoint-url http://floci:4566 \
		--region us-east-1 \
		--output table 2>/dev/null || echo "Ejecuta 'make db-setup' primero"

db-reset: ## Eliminar y recrear tabla (WARNING: borra datos)
	@docker compose --env-file .env.local run --rm awscli dynamodb delete-table \
		--table-name merchants \
		--endpoint-url http://floci:4566 \
		--region us-east-1 2>/dev/null || true
	@echo "🗑️  Tabla eliminada."
	bash scripts/setup-dynamodb.sh
	bash scripts/seed-data.sh

# ==============================================================================
# AUTENTICACIÓN (LOCAL — Cognito en FLOCI)
# ==============================================================================

setup: ## Setup completo: Cognito + DynamoDB + SQS + datos de prueba
	bash scripts/setup-all.sh

cognito-setup: ## Crear User Pool + App Client + Test User en FLOCI
	bash scripts/setup-cognito.sh

# ==============================================================================
# UTILIDADES (LOCAL)
# ==============================================================================

logs: ## Ver logs de todos los servicios
	docker compose --env-file .env.local logs -f

shell-frontend: ## Shell en el contenedor frontend
	docker compose --env-file .env.local exec frontend sh

shell-backend: ## Shell en el contenedor backend
	docker compose --env-file .env.local exec backend sh

floci-health: ## Verificar FLOCI saludable
	@curl -s http://localhost:4566/_localstack/health | head -20

clean: ## Limpiar contenedores y volúmenes
	docker compose --env-file .env.local down -v --remove-orphans

# ==============================================================================
# PRODUCCION AWS — usa .env.production (credenciales AWS)
# ==============================================================================

build-lambda: ## Build Lambda ZIP files with esbuild
	bash scripts/build-lambda.sh

build-frontend: ## Build frontend static export for S3+CloudFront
	bash scripts/build-frontend.sh

infra-init: ## terraform init
	docker compose --env-file .env.production run --rm infra init

infra-plan: ## terraform plan
	docker compose --env-file .env.production run --rm infra plan

infra-apply: ## terraform apply
	docker compose --env-file .env.production run --rm infra apply -auto-approve

infra-destroy: ## terraform destroy
	docker compose --env-file .env.production run --rm infra destroy

infra-validate: ## terraform validate
	docker compose --env-file .env.production run --rm infra validate

deploy-frontend: build-frontend ## Build + S3 sync + CloudFront invalidation
	docker compose --env-file .env.production run --rm awscli s3 sync frontend/out s3://mini-onboarding-frontend-dev --delete --region us-east-1
	docker compose --env-file .env.production run --rm awscli cloudfront create-invalidation --distribution-id E2DHXR0SE82POU --paths "/*" --region us-east-1

deploy-lambda: build-lambda ## Build + deploy Lambda ZIPs
	@echo "📦 Lambda ZIPs ready in build/"
	@echo "Run 'make infra-apply' to deploy via Terraform"

# ==============================================================================
# OBSERVABILIDAD AWS
# ==============================================================================

logs-merchants: ## Logs del merchants Lambda (tiempo real)
	docker compose --env-file .env.production run --rm awscli logs tail \
		/aws/lambda/mini-onboarding-dev-merchants \
		--follow --region us-east-1 --format short

logs-enricher: ## Logs del enricher Lambda (tiempo real)
	docker compose --env-file .env.production run --rm awscli logs tail \
		/aws/lambda/mini-onboarding-dev-enricher \
		--follow --region us-east-1 --format short

logs-apigw: ## Access logs de API Gateway (tiempo real)
	docker compose --env-file .env.production run --rm awscli logs tail \
		/aws/apigateway/mini-onboarding-dev \
		--follow --region us-east-1 --format short

logs-all: ## Logs de todos los servicios Lambda (tiempo real)
	docker compose --env-file .env.production run --rm awscli logs tail \
		--log-group-name-pattern "/aws/lambda/mini-onboarding" \
		--follow --region us-east-1 --format short

sqs-status: ## Estado de la cola SQS
	docker compose --env-file .env.production run --rm awscli sqs get-queue-attributes \
		--queue-url https://sqs.us-east-1.amazonaws.com/459321894062/mini-onboarding-dev-enrichment \
		--attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
		--region us-east-1

alarm-status: ## Estado de las alarmas CloudWatch
	docker compose --env-file .env.production run --rm awscli cloudwatch describe-alarms \
		--alarm-name-prefix mini-onboarding --region us-east-1

xray-traces: ## Traces recientes de X-Ray (última hora)
	docker compose --env-file .env.production run --rm awscli xray get-trace-summaries \
		--start-time $$(date -d '1 hour ago' +%s) \
		--end-time $$(date +%s) \
		--region us-east-1
