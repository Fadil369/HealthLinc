#!/bin/bash

# Environment Setup Script for BrainSAIT-Unified
# This script helps set up the Cloudflare Workers environment

set -e

ENVIRONMENT=${1:-"development"}

echo "🔧 Setting up BrainSAIT-Unified environment: $ENVIRONMENT"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "❌ Wrangler CLI not found. Installing..."
  npm install -g wrangler
fi

# Check authentication
if ! wrangler whoami &> /dev/null; then
  echo "🔐 Please authenticate with Cloudflare:"
  wrangler login
fi

# Create KV namespaces if they don't exist
echo "📦 Setting up KV namespaces..."

case $ENVIRONMENT in
  production)
    echo "Creating production KV namespace..."
    wrangler kv namespace create "BRAINSAIT_KV" --env production || echo "KV namespace may already exist"
    ;;
  staging)
    echo "Creating staging KV namespace..."
    wrangler kv namespace create "BRAINSAIT_KV" --env staging || echo "KV namespace may already exist"
    ;;
  *)
    echo "Creating development KV namespace..."
    wrangler kv namespace create "BRAINSAIT_KV" || echo "KV namespace may already exist"
    ;;
esac

# Set up secrets
echo "🔐 Setting up secrets..."

setup_secret() {
  local secret_name="$1"
  local description="$2"
  local example="$3"
  
  echo ""
  echo "Setting up: $secret_name"
  echo "Description: $description"
  echo "Example: $example"
  
  if wrangler secret list --env "$ENVIRONMENT" 2>/dev/null | grep -q "$secret_name"; then
    echo "✅ Secret $secret_name already exists"
    read -p "Update it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      read -s -p "Enter new value for $secret_name: " secret_value
      echo
      echo "$secret_value" | wrangler secret put "$secret_name" --env "$ENVIRONMENT"
    fi
  else
    read -s -p "Enter value for $secret_name: " secret_value
    echo
    if [ -n "$secret_value" ]; then
      echo "$secret_value" | wrangler secret put "$secret_name" --env "$ENVIRONMENT"
      echo "✅ Secret $secret_name set successfully"
    else
      echo "⚠️  Skipping $secret_name (empty value)"
    fi
  fi
}

# Required secrets
setup_secret "JWT_SECRET" "Secret key for JWT token signing" "your-super-secret-jwt-key-min-32-chars"
setup_secret "OPENAI_API_KEY" "OpenAI API key for AI features" "sk-..."
setup_secret "NPHIES_CLIENT_ID" "NPHIES client ID for Saudi insurance integration" "your-nphies-client-id"
setup_secret "NPHIES_CLIENT_SECRET" "NPHIES client secret" "your-nphies-client-secret"
setup_secret "STRIPE_SECRET_KEY" "Stripe secret key for payment processing" "sk_test_... or sk_live_..."

# Optional secrets
echo ""
echo "🔧 Optional secrets (press Enter to skip):"
setup_secret "ANTHROPIC_API_KEY" "Anthropic API key for Claude AI" "sk-ant-..."
setup_secret "SMTP_PASSWORD" "SMTP password for email notifications" "your-smtp-password"
setup_secret "DATABASE_URL" "External database URL if not using D1" "postgresql://..."

# Create sample environment file
echo ""
echo "📝 Creating sample environment file..."
cat > .env.example << EOF
# BrainSAIT-Unified Environment Variables
# Copy this to .env.local and fill in your values

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# AI Service Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# NPHIES Integration (Saudi Insurance)
NPHIES_CLIENT_ID=your-nphies-client-id
NPHIES_CLIENT_SECRET=your-nphies-client-secret
NPHIES_BASE_URL=https://api.nphies.sa

# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Database (if using external DB)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Application Configuration
APP_NAME=BrainSAIT-Unified
APP_URL=https://your-domain.com
SUPPORT_EMAIL=support@your-domain.com
EOF

echo "✅ Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update your secrets if needed"
echo "2. Update KV namespace IDs in wrangler.toml if they were created"
echo "3. Configure custom domains in wrangler.toml (optional)"
echo "4. Run: npm run build"
echo "5. Run: npm run deploy"
echo ""
echo "🔍 Useful commands:"
echo "   List secrets: wrangler secret list --env $ENVIRONMENT"
echo "   Delete secret: wrangler secret delete SECRET_NAME --env $ENVIRONMENT"
echo "   List KV namespaces: wrangler kv namespace list"
echo "   View logs: wrangler tail --env $ENVIRONMENT"
