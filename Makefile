.PHONY: help dev dev-frontend dev-backend dev-floci \
       test test-unit test-integration test-e2e \
       db-setup db-seed db-shell db-reset \
       cognito-setup \
       infra-init infra-plan infra-apply infra-destroy infra-validate \
       deploy deploy-infra \
       logs shell-frontend shell-backend floci-health clean

# ==============================================================================
# Desarrollo
# ==============================================================================

help: ## Mostrar esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Levantar todo con docker compose
	docker compose up

dev-frontend: ## Levantar solo frontend
	docker compose up frontend

dev-backend: ## Levantar solo backend
	docker compose up backend

dev-floci: ## Levantar solo FLOCI
	docker compose up floci

# ==============================================================================
# Tests
# ==============================================================================

test: ## Ejecutar todos los tests
	docker compose run --rm backend pnpm test

test-unit: ## Ejecutar solo unit tests
	docker compose run --rm backend pnpm test:unit

test-integration: ## Ejecutar solo integration tests
	docker compose exec backend pnpm test:integration

test-e2e: ## Ejecutar solo e2e tests
	docker compose exec backend pnpm test:e2e

# ==============================================================================
# Base de datos (DynamoDB en FLOCI)
# ==============================================================================

db-setup: ## Crear tabla merchants + GSIs en FLOCI
	bash scripts/setup-dynamodb.sh

db-seed: ## Insertar merchants de prueba en FLOCI
	bash scripts/seed-data.sh

db-shell: ## Ver todos los merchants (scan)
	@docker compose run --rm awscli dynamodb scan \
		--table-name merchants \
		--endpoint-url http://floci:4566 \
		--region us-east-1 \
		--output table 2>/dev/null || echo "Ejecuta 'make db-setup' primero"

db-reset: ## Eliminar y recrear tabla (WARNING: borra datos)
	@docker compose run --rm awscli dynamodb delete-table \
		--table-name merchants \
		--endpoint-url http://floci:4566 \
		--region us-east-1 2>/dev/null || true
	@echo "🗑️  Tabla eliminada."
	bash scripts/setup-dynamodb.sh
	bash scripts/seed-data.sh

# ==============================================================================
# Autenticación (Cognito en FLOCI)
# ==============================================================================

cognito-setup: ## Crear User Pool + App Client + Test User en FLOCI
	bash scripts/setup-cognito.sh

# ==============================================================================
# Infraestructura
# ==============================================================================

infra-init: ## terraform init
	docker compose run --rm infra terraform init

infra-plan: ## terraform plan
	docker compose run --rm infra terraform plan

infra-apply: ## terraform apply (auto-approve para dev)
	docker compose run --rm infra terraform apply -auto-approve

infra-destroy: ## terraform destroy
	docker compose run --rm infra terraform destroy

infra-validate: ## terraform validate + plan
	docker compose run --rm infra terraform validate
	docker compose run --rm infra terraform plan

# ==============================================================================
# Deploy
# ==============================================================================

deploy: ## Build + S3 sync + CloudFront invalidation
	cd frontend && pnpm build
	aws s3 sync frontend/out s3://$(FRONTEND_BUCKET) --delete
	aws cloudfront create-invalidation --distribution-id $(CF_DISTRIBUTION_ID) --paths "/*"

# ==============================================================================
# Utilidades
# ==============================================================================

logs: ## Ver logs de todos los servicios
	docker compose logs -f

shell-frontend: ## Shell en el contenedor frontend
	docker compose exec frontend sh

shell-backend: ## Shell en el contenedor backend
	docker compose exec backend sh

floci-health: ## Verificar FLOCI saludable
	@curl -s http://localhost:4566/_localstack/health | head -20

clean: ## Limpiar contenedores y volúmenes
	docker compose down -v --remove-orphans
