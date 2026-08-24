#!/bin/bash
set -euo pipefail

# ============================================================================
# build-lambda.sh — Bundle Lambda handlers with esbuild
#
# Creates production-ready ZIP files for deployment:
#   - build/merchants.zip (createMerchant handler)
#   - build/enricher.zip (enrichment processor)
#
# Usage:
#   make build-lambda
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$PROJECT_DIR/build"

echo "🔧 Building Lambda functions..."

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "📦 Building inside Docker..."

docker compose run --rm \
  -v "$BUILD_DIR:/build" \
  -w /app \
  backend sh -c '
  apt-get update -qq && apt-get install -y -qq zip > /dev/null 2>&1

  echo "📦 Bundling merchants handler..."
  mkdir -p /build/merchants
  pnpm exec esbuild src/handlers/merchants.ts \
    --bundle --platform=node --target=node20 --format=esm \
    --outfile=/build/merchants/index.js \
    --external:@aws-sdk/* --minify

  echo "📦 Bundling enricher handler..."
  mkdir -p /build/enricher
  pnpm exec esbuild src/handlers/enricher.ts \
    --bundle --platform=node --target=node20 --format=esm \
    --outfile=/build/enricher/index.js \
    --external:@aws-sdk/* --minify

  echo "📦 Creating ZIP files..."
  cd /build/merchants && zip -q /build/merchants.zip index.js
  cd /build/enricher && zip -q /build/enricher.zip index.js

  echo "✅ Build complete!"
  ls -lh /build/*.zip
'

echo ""
echo "✅ Lambda build complete!"
echo ""
echo "Output files:"
ls -lh "$BUILD_DIR"/*.zip
echo ""
echo "Next steps:"
echo "  make infra-init"
echo "  make infra-plan"
echo "  make infra-apply"
