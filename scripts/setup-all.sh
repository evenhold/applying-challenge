#!/bin/bash
set -euo pipefail

# =============================================================================
# Setup All - Crea todos los recursos en FLOCI
# Ejecutar después de: docker compose up -d floci
# =============================================================================

echo "🔧 Setup completo de FLOCI..."
echo ""

# 1. Cognito
echo "══════════════════════════════════════"
echo "  PASO 1/3: Cognito"
echo "══════════════════════════════════════"
bash scripts/setup-cognito.sh

echo ""
echo "══════════════════════════════════════"
echo "  PASO 2/3: DynamoDB + SQS"
echo "══════════════════════════════════════"
bash scripts/setup-dynamodb.sh

echo ""
echo "══════════════════════════════════════"
echo "  PASO 3/3: Datos de prueba"
echo "══════════════════════════════════════"
bash scripts/seed-data.sh

echo ""
echo "✅ Setup completo. Todos los servicios están listos."
echo ""
echo "Para iniciar:"
echo "  docker compose up -d"
