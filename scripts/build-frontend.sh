#!/bin/bash
set -euo pipefail

# ============================================================================
# build-frontend.sh — Build + Deploy frontend to AWS
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🔧 Step 1: Building Next.js..."

# Create container, run build, copy output
CID=$(docker create \
  -v "$FRONTEND_DIR/src:/app/src" \
  -v "$FRONTEND_DIR/package.json:/app/package.json:ro" \
  -v "$FRONTEND_DIR/pnpm-lock.yaml:/app/pnpm-lock.yaml:ro" \
  -v "$FRONTEND_DIR/next.config.ts:/app/next.config.ts:ro" \
  -v "$FRONTEND_DIR/tsconfig.json:/app/tsconfig.json:ro" \
  -w /app \
  -e CI=true \
  -e "NEXT_PUBLIC_API_URL=https://qiq4nwptz1.execute-api.us-east-1.amazonaws.com" \
  -e "NEXT_PUBLIC_COGNITO_CLIENT_ID=4o7vqppl5rh1vre3cppd4ke81s" \
  -e "NEXT_PUBLIC_COGNITO_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_S33rLXlec" \
  -e "NEXT_PUBLIC_COGNITO_REGION=us-east-1" \
  node:24-slim \
  sh -c '
    corepack enable && corepack prepare pnpm@latest --activate
    pnpm install --no-frozen-lockfile --ignore-scripts
    mv src/app/api src/_api_backup 2>/dev/null || true
    pnpm exec next build
    mv src/_api_backup src/app/api 2>/dev/null || true
    grep -rl qiq4nwptz1 out/ | head -3
  '
)

docker start -a "$CID"

# Copy build output from container to host (fresh)
TMP_OUT=$(mktemp -d)
docker cp "$CID:/app/out/." "$TMP_OUT"
docker rm "$CID" > /dev/null 2>&1

# Replace host out/ — Docker cleans the old one
docker run --rm -v "$FRONTEND_DIR:/data" alpine sh -c "rm -rf /data/out /data/out-old"
mv "$TMP_OUT" "$FRONTEND_DIR/out"

echo "📁 Build output:"
ls "$FRONTEND_DIR/out/" | head -5

echo "🚀 Step 2: Uploading to S3..."
docker compose run --rm \
  -v "$FRONTEND_DIR/out:/out:ro" \
  -w /out \
  awscli s3 sync . s3://mini-onboarding-frontend-dev --delete --region us-east-1 2>&1 | grep -v warning | tail -5

echo "🔄 Step 3: Invalidating CloudFront..."
docker compose run --rm \
  awscli cloudfront create-invalidation --distribution-id E2DHXR0SE82POU --paths "/*" --region us-east-1 2>&1 | grep -v warning

echo ""
echo "✅ Deployed! https://d1vazin5v6ecqg.cloudfront.net"
