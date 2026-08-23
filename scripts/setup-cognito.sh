#!/bin/bash
set -euo pipefail

# =============================================================================
# Setup Cognito - Crea User Pool + App Client + Test User en FLOCI
# Ejecutar: make cognito-setup
# =============================================================================

ENDPOINT="http://floci:4566"
REGION="us-east-1"
AWS="docker compose run --rm awscli"
POOL_NAME="mini-onboarding-sellers"
CLIENT_NAME="mini-onboarding-web"
TEST_EMAIL="seller@test.com"
TEST_PASSWORD="Seller123!"

echo "🔍 Verificando si el User Pool $POOL_NAME existe..."

POOL_ID=$($AWS cognito-idp list-user-pools \
  --max-results 10 \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query "UserPools[?Name=='$POOL_NAME'].Id" \
  --output text 2>/dev/null || echo "")

if [ -n "$POOL_ID" ] && [ "$POOL_ID" != "None" ]; then
  echo "✅ User Pool $POOL_NAME ya existe (ID: $POOL_ID)."
else
  echo "📝 Creando User Pool $POOL_NAME..."
  POOL_ID=$($AWS cognito-idp create-user-pool \
    --pool-name "$POOL_NAME" \
    --policies '{
      "PasswordPolicy": {
        "MinimumLength": 8,
        "RequireUppercase": true,
        "RequireLowercase": true,
        "RequireNumbers": true,
        "RequireSymbols": false
      }
    }' \
    --username-attributes email \
    --auto-verified-attributes email \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION" \
    --query 'UserPool.Id' \
    --output text)
  echo "✅ User Pool creado (ID: $POOL_ID)."
fi

echo ""
echo "🔍 Verificando si el App Client $CLIENT_NAME existe..."

CLIENT_ID=$($AWS cognito-idp list-user-pool-clients \
  --user-pool-id "$POOL_ID" \
  --max-results 10 \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query "UserPoolClients[?ClientName=='$CLIENT_NAME'].ClientId" \
  --output text 2>/dev/null || echo "")

if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "None" ]; then
  echo "✅ App Client $CLIENT_NAME ya existe (ID: $CLIENT_ID)."
else
  echo "📝 Creando App Client $CLIENT_NAME..."
  CLIENT_ID=$($AWS cognito-idp create-user-pool-client \
    --user-pool-id "$POOL_ID" \
    --client-name "$CLIENT_NAME" \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION" \
    --query 'UserPoolClient.ClientId' \
    --output text)
  echo "✅ App Client creado (ID: $CLIENT_ID)."
fi

echo ""
echo "🔍 Verificando si el usuario de prueba existe..."

USER_EXISTS=$($AWS cognito-idp admin-get-user \
  --user-pool-id "$POOL_ID" \
  --username "$TEST_EMAIL" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query 'Username' \
  --output text 2>/dev/null || echo "")

if [ -n "$USER_EXISTS" ] && [ "$USER_EXISTS" != "None" ]; then
  echo "✅ Usuario $TEST_EMAIL ya existe."
else
  echo "📝 Creando usuario de prueba $TEST_EMAIL..."
  $AWS cognito-idp admin-create-user \
    --user-pool-id "$POOL_ID" \
    --username "$TEST_EMAIL" \
    --user-attributes "Name=email,Value=$TEST_EMAIL" "Name=email_verified,Value=true" \
    --temporary-password "Temp1234!" \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION" > /dev/null

  $AWS cognito-idp admin-set-user-password \
    --user-pool-id "$POOL_ID" \
    --username "$TEST_EMAIL" \
    --password "$TEST_PASSWORD" \
    --permanent \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION"

  echo "✅ Usuario creado (email: $TEST_EMAIL, password: $TEST_PASSWORD)."
fi

echo ""
echo "🧪 Probando autenticación..."
AUTH_RESULT=$($AWS cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$CLIENT_ID" \
  --auth-parameters "{\"USERNAME\":\"$TEST_EMAIL\",\"PASSWORD\":\"$TEST_PASSWORD\"}" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --query 'AuthenticationResult.AccessToken' \
  --output text 2>/dev/null || echo "")

if [ -n "$AUTH_RESULT" ] && [ "$AUTH_RESULT" != "None" ]; then
  echo "✅ Autenticación exitosa."
else
  echo "❌ Error en la autenticación."
fi

echo ""
echo "📊 Resumen:"
echo "  User Pool ID:  $POOL_ID"
echo "  Client ID:     $CLIENT_ID"
echo "  Test User:     $TEST_EMAIL"
echo "  Test Password: $TEST_PASSWORD"
echo ""
echo "Variables de entorno para .env:"
echo "  COGNITO_USER_POOL_ID=$POOL_ID"
echo "  COGNITO_CLIENT_ID=$CLIENT_ID"
echo "  COGNITO_REGION=$REGION"
