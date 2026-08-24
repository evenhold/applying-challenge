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
#   bash scripts/build-lambda.sh
#
# Requirements:
#   - Node.js >= 20
#   - pnpm
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../backend" && pwd)"
BUILD_DIR="$SCRIPT_DIR/../build"

echo "🔧 Building Lambda functions..."

# Clean previous builds
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/merchants" "$BUILD_DIR/enricher"

# Install dependencies (production only)
cd "$BACKEND_DIR"
echo "📦 Installing production dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Bundle merchants handler
echo "📦 Bundling merchants handler..."
pnpm exec esbuild src/handlers/merchants.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile="$BUILD_DIR/merchants/index.js" \
  --external:@aws-sdk/* \
  --minify

# Bundle enricher handler
echo "📦 Bundling enricher handler..."
pnpm exec esbuild src/handlers/enricher.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile="$BUILD_DIR/enricher/index.js" \
  --external:@aws-sdk/* \
  --minify

# Create ZIP files
cd "$BUILD_DIR"
echo "📦 Creating merchants.zip..."
cd merchants && zip -q ../merchants.zip index.js && cd ..

echo "📦 Creating enricher.zip..."
cd enricher && zip -q ../enricher.zip index.js && cd ..

# Report results
echo ""
echo "✅ Lambda build complete!"
echo ""
echo "Output files:"
ls -lh "$BUILD_DIR"/*.zip 2>/dev/null
echo ""
echo "To deploy:"
echo "  1. cd terraform/environments/dev"
echo "  2. terraform init"
echo "  3. terraform apply"
