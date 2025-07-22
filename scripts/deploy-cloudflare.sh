#!/bin/bash
set -e

# Deployment script for BrainSAIT to Cloudflare Workers
# Usage: ./deploy-cloudflare.sh [environment]

# Default environment is staging
ENVIRONMENT=${1:-staging}
echo "Deploying to Cloudflare Workers - Environment: $ENVIRONMENT"

# 1. Build the frontend
echo "Building frontend..."
cd /Users/fadil369/BrainSAIT-Unified/frontend
npm run build

# 2. Build the Worker
echo "Building Cloudflare Worker..."
npm run build:worker

# 3. Upload static assets to KV storage
echo "Uploading static assets to KV..."
if [ "$ENVIRONMENT" == "production" ]; then
  KV_NAMESPACE_ID="your-prod-kv-namespace-id"
else
  KV_NAMESPACE_ID="your-staging-kv-namespace-id" 
fi

../scripts/upload-assets-to-kv.sh "$KV_NAMESPACE_ID" "$ENVIRONMENT"

# 4. Deploy the Worker
echo "Deploying Worker to Cloudflare..."
if [ "$ENVIRONMENT" == "production" ]; then
  npm run deploy:production
else
  npm run deploy:staging
fi

echo "Deployment complete! Worker is now live on Cloudflare."
if [ "$ENVIRONMENT" == "production" ]; then
  echo "Production URL: https://brainsait.com"
else
  echo "Staging URL: https://staging.brainsait.com"
fi
