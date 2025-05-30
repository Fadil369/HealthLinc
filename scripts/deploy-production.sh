#!/bin/bash

# Production Deployment Script for BrainSAIT-Unified
# This script handles the complete deployment process to Cloudflare Workers

set -e

# Configuration
WORKER_NAME="brainsait-unified"
CUSTOM_DOMAIN=${CUSTOM_DOMAIN:-""}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo "🚀 Starting BrainSAIT-Unified Production Deployment"
echo "Environment: $ENVIRONMENT"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if wrangler is installed and authenticated
if ! command -v wrangler &> /dev/null; then
  echo "❌ Wrangler CLI not found. Please install it first:"
  echo "npm install -g wrangler"
  exit 1
fi

# Check authentication
if ! wrangler whoami &> /dev/null; then
  echo "❌ Not authenticated with Cloudflare. Please run:"
  echo "wrangler login"
  exit 1
fi

# Verify required secrets are set
echo "🔐 Checking required secrets..."
required_secrets=(
  "JWT_SECRET"
  "OPENAI_API_KEY"
  "NPHIES_CLIENT_ID"
  "NPHIES_CLIENT_SECRET"
  "STRIPE_SECRET_KEY"
)

missing_secrets=()
for secret in "${required_secrets[@]}"; do
  if ! wrangler secret list | grep -q "$secret"; then
    missing_secrets+=("$secret")
  fi
done

if [ ${#missing_secrets[@]} -gt 0 ]; then
  echo "⚠️  Missing required secrets. Please set them first:"
  for secret in "${missing_secrets[@]}"; do
    echo "wrangler secret put $secret"
  done
  echo ""
  echo "💡 You can also set them from environment variables:"
  echo "export JWT_SECRET=your_secret_here"
  echo "wrangler secret put JWT_SECRET --env production < <(echo \$JWT_SECRET)"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Clean and build
echo "🧹 Cleaning previous builds..."
rm -rf frontend/dist dist *.js *.js.map

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Upload static assets
echo "📤 Uploading static assets..."
./scripts/upload-assets.sh

if [ $? -ne 0 ]; then
  echo "❌ Asset upload failed!"
  exit 1
fi

# Deploy worker
echo "🚀 Deploying Cloudflare Worker..."
if [ "$ENVIRONMENT" = "production" ]; then
  wrangler deploy --env production
else
  wrangler deploy
fi

if [ $? -ne 0 ]; then
  echo "❌ Worker deployment failed!"
  exit 1
fi

# Set up custom domain if provided
if [ -n "$CUSTOM_DOMAIN" ]; then
  echo "🌐 Setting up custom domain: $CUSTOM_DOMAIN"
  # Note: This requires manual DNS configuration
  echo "⚠️  Please ensure your DNS is configured to point to Cloudflare Workers:"
  echo "   1. Add a CNAME record for $CUSTOM_DOMAIN pointing to $WORKER_NAME.your-subdomain.workers.dev"
  echo "   2. Or use Cloudflare's dashboard to configure the custom domain"
fi

# Run health check
echo "🏥 Running health check..."
if [ -n "$CUSTOM_DOMAIN" ]; then
  health_url="https://$CUSTOM_DOMAIN/api/health"
else
  # Get the default workers.dev URL
  health_url="https://$WORKER_NAME.your-subdomain.workers.dev/api/health"
fi

echo "Checking: $health_url"
sleep 5  # Wait for deployment to propagate

if curl -s "$health_url" | grep -q "healthy"; then
  echo "✅ Health check passed!"
else
  echo "⚠️  Health check failed. The service might still be propagating..."
fi

# Deployment summary
echo ""
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Worker URL: https://$WORKER_NAME.your-subdomain.workers.dev"
if [ -n "$CUSTOM_DOMAIN" ]; then
  echo "🌐 Custom Domain: https://$CUSTOM_DOMAIN"
fi
echo "🔗 API Docs: $health_url/../docs"
echo "📊 Dashboard: https://dash.cloudflare.com/workers"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: wrangler tail"
echo "   Check status: curl $health_url"
echo "   Update secrets: wrangler secret put SECRET_NAME"
echo ""
echo "🚀 Your BrainSAIT-Unified platform is now live!"
