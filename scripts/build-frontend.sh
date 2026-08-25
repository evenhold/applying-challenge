#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🔧 Building frontend for production..."

CID=$(docker create \
  --network host \
  -v "$FRONTEND_DIR/package.json:/app/package.json:ro" \
  -v "$FRONTEND_DIR/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro" \
  -v "$FRONTEND_DIR/next.config.ts:/app/next.config.ts:ro" \
  -v "$FRONTEND_DIR/tsconfig.json:/app/tsconfig.json:ro" \
  -v "$FRONTEND_DIR/src:/app/src" \
  -w /app \
  -e CI=true \
  -e "NEXT_PUBLIC_API_URL=https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com" \
  -e "NEXT_PUBLIC_COGNITO_CLIENT_ID=4o7vqppl5rh1vre3cppd4ke81s" \
  -e "NEXT_PUBLIC_COGNITO_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_S33rLXlec" \
  -e "NEXT_PUBLIC_COGNITO_REGION=us-east-1" \
  -e "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}" \
  -e "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}" \
  -e "AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN:-}" \
  -e "AWS_REGION=us-east-1" \
  node:24-slim \
  sh -c "
    corepack enable && corepack prepare pnpm@latest --activate
    pnpm install --no-frozen-lockfile --ignore-scripts

    # Remove API routes for static export
    mv src/app/api src/_api_backup 2>/dev/null || true
    pnpm exec next build
    mv src/_api_backup src/app/api 2>/dev/null || true

    # Install awscli and deploy
    apt-get update -qq && apt-get install -y -qq awscli > /dev/null 2>&1
    aws s3 sync out s3://mini-onboarding-frontend-dev --delete --region us-east-1
    aws cloudfront create-invalidation --distribution-id E2DHXR0SE82POU --paths '/*' --region us-east-1

    echo 'Verify env vars:'
    grep -rl 'qiq4nwptz1' out/ | head -3
  "
)

docker start -a "$CID"
docker rm "$CID" > /dev/null 2>&1

echo ""
echo "✅ Frontend deployed!"
echo "URL: https://d1vazin5v6ecqg.cloudfront.net"
