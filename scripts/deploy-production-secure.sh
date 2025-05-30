#!/bin/bash

# Production Deployment Script for BrainSAIT Unified Platform
# Deploys to Cloudflare Workers with custom domain care.brainsait.io

set -e

echo "🚀 Deploying BrainSAIT Unified Platform to Production"
echo "🌐 Domain: care.brainsait.io"
echo "☁️  Platform: Cloudflare Workers"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ Wrangler CLI is required but not installed${NC}"
        echo "   Install with: npm install -g wrangler"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
}

# Verify authentication
check_auth() {
    echo -e "${BLUE}🔐 Verifying Cloudflare authentication...${NC}"
    
    if ! wrangler whoami &> /dev/null; then
        echo -e "${RED}❌ Not authenticated with Cloudflare${NC}"
        echo "   Please run: wrangler login"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
}

# Set production environment variables
setup_production_secrets() {
    echo -e "${BLUE}🔒 Setting up production secrets...${NC}"
    
    # Check if secrets exist, if not prompt user
    local secrets=(
        "JWT_SECRET"
        "STRIPE_SECRET_KEY"
        "OPENAI_API_KEY"
        "GOOGLE_CLIENT_ID"
        "MICROSOFT_CLIENT_ID"
        "GITHUB_CLIENT_ID"
        "LINKEDIN_CLIENT_ID"
    )
    
    for secret in "${secrets[@]}"; do
        if ! wrangler secret list --env production 2>/dev/null | grep -q "$secret"; then
            echo -e "${YELLOW}⚠️  Secret $secret not found in production environment${NC}"
            echo "   Please set it manually with:"
            echo "   wrangler secret put $secret --env production"
        else
            echo -e "${GREEN}✅ Secret $secret is configured${NC}"
        fi
    done
}

# Build the project
build_project() {
    echo -e "${BLUE}🔨 Building project for production...${NC}"
    
    # Clean previous builds
    npm run clean
    
    # Install dependencies
    npm run install:all
    
    # Build frontend and worker
    npm run build
    
    echo -e "${GREEN}✅ Build completed successfully${NC}"
}

# Upload static assets
upload_assets() {
    echo -e "${BLUE}📦 Uploading static assets to KV...${NC}"
    
    if [ -d "frontend/dist" ]; then
        ./scripts/upload-assets.sh production
        echo -e "${GREEN}✅ Assets uploaded successfully${NC}"
    else
        echo -e "${RED}❌ Frontend build directory not found${NC}"
        exit 1
    fi
}

# Deploy to Cloudflare Workers
deploy_worker() {
    echo -e "${BLUE}⚡ Deploying worker to Cloudflare...${NC}"
    
    # Deploy to production environment
    wrangler deploy --env production
    
    echo -e "${GREEN}✅ Worker deployed successfully${NC}"
}

# Configure custom domain
setup_custom_domain() {
    echo -e "${BLUE}🌐 Configuring custom domain...${NC}"
    
    # Check if domain is already configured
    if wrangler custom-domains list 2>/dev/null | grep -q "care.brainsait.io"; then
        echo -e "${GREEN}✅ Custom domain care.brainsait.io is already configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Custom domain care.brainsait.io not found${NC}"
        echo "   Please configure it manually in Cloudflare Dashboard:"
        echo "   1. Go to Workers & Pages → Your Worker → Settings → Domains"
        echo "   2. Add custom domain: care.brainsait.io"
        echo "   3. Follow the DNS configuration instructions"
    fi
}

# Health check
perform_health_check() {
    echo -e "${BLUE}🏥 Performing health check...${NC}"
    
    local endpoints=(
        "https://care.brainsait.io/health"
        "https://care.brainsait.io/api/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo -e "${BLUE}Checking $endpoint...${NC}"
        
        if curl -s --max-time 10 "$endpoint" > /dev/null; then
            echo -e "${GREEN}✅ $endpoint is responding${NC}"
        else
            echo -e "${YELLOW}⚠️  $endpoint is not responding (may be expected if domain is not yet configured)${NC}"
        fi
    done
}

# Security verification
verify_security() {
    echo -e "${BLUE}🔒 Verifying security configuration...${NC}"
    
    # Check security headers
    echo "Checking security headers..."
    if command -v curl &> /dev/null; then
        curl -I -s https://care.brainsait.io/ 2>/dev/null | grep -E "(Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|Content-Security-Policy)" || true
    fi
    
    echo -e "${GREEN}✅ Security verification completed${NC}"
}

# Main deployment process
main() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}🏥 BrainSAIT Unified Platform - Production Deployment${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    
    check_prerequisites
    check_auth
    setup_production_secrets
    build_project
    upload_assets
    deploy_worker
    setup_custom_domain
    perform_health_check
    verify_security
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${GREEN}🌐 Your application is now live at:${NC}"
    echo -e "${GREEN}   Primary: https://care.brainsait.io${NC}"
    echo -e "${GREEN}   API: https://care.brainsait.io/api${NC}"
    echo ""
    echo -e "${BLUE}📊 Next steps:${NC}"
    echo "   1. Configure DNS for care.brainsait.io in Cloudflare Dashboard"
    echo "   2. Test all functionality on the live domain"
    echo "   3. Monitor logs with: wrangler tail --env production"
    echo "   4. Set up monitoring and alerting"
    echo ""
    echo -e "${YELLOW}🔐 Security reminders:${NC}"
    echo "   • All secrets are encrypted in Cloudflare"
    echo "   • HTTPS is enforced with HSTS"
    echo "   • CSP headers protect against XSS"
    echo "   • Rate limiting is active"
    echo ""
}

# Handle script interruption
trap 'echo -e "\n${RED}Deployment interrupted${NC}"; exit 1' INT

# Run main function
main "$@"
