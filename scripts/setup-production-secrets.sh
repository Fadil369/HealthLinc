#!/bin/bash

# Production Secrets Setup Script for BrainSAIT Unified Platform
# Helps configure all required environment variables and secrets for production

set -e

echo "🔒 BrainSAIT Production Secrets Setup"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to set secret with wrangler
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local environment=${3:-production}
    
    echo -e "${BLUE}Setting $secret_name...${NC}"
    echo "$secret_value" | wrangler secret put "$secret_name" --env "$environment"
    echo -e "${GREEN}✅ $secret_name configured${NC}"
}

# Function to prompt for secret with validation
prompt_for_secret() {
    local secret_name=$1
    local description=$2
    local required=${3:-true}
    local example=${4:-""}
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔑 $secret_name${NC}"
    echo -e "${BLUE}Description: $description${NC}"
    
    if [ -n "$example" ]; then
        echo -e "${BLUE}Example: $example${NC}"
    fi
    
    if [ "$required" = true ]; then
        echo -e "${RED}Required: Yes${NC}"
    else
        echo -e "${YELLOW}Required: No (optional)${NC}"
    fi
    
    echo ""
    
    while true; do
        if [ "$secret_name" = "JWT_SECRET" ]; then
            echo -e "${BLUE}Would you like to generate a secure JWT secret automatically? (y/n):${NC}"
            read -r generate_jwt
            if [ "$generate_jwt" = "y" ] || [ "$generate_jwt" = "Y" ]; then
                echo "$(generate_secret)"
                return
            fi
        fi
        
        echo -n "Enter $secret_name: "
        if [[ "$secret_name" == *"SECRET"* ]] || [[ "$secret_name" == *"KEY"* ]]; then
            read -s secret_value
            echo ""
        else
            read -r secret_value
        fi
        
        if [ -n "$secret_value" ]; then
            echo "$secret_value"
            return
        elif [ "$required" = false ]; then
            echo ""
            return
        else
            echo -e "${RED}This field is required. Please enter a value.${NC}"
        fi
    done
}

# Main setup function
setup_secrets() {
    echo -e "${BLUE}This script will help you configure all required secrets for production deployment.${NC}"
    echo -e "${YELLOW}⚠️  Keep these secrets secure and never share them publicly.${NC}"
    echo ""
    
    # Check if wrangler is authenticated
    if ! wrangler whoami &> /dev/null; then
        echo -e "${RED}❌ Please authenticate with Cloudflare first: wrangler login${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
    echo ""
    
    # Define secrets with descriptions (using arrays for compatibility)
    secret_names=("JWT_SECRET" "STRIPE_SECRET_KEY" "OPENAI_API_KEY" "GOOGLE_CLIENT_ID" "MICROSOFT_CLIENT_ID" "GITHUB_CLIENT_ID" "LINKEDIN_CLIENT_ID")
    secret_descriptions=(
        "Secret key for JWT token signing and verification"
        "Stripe secret key for payment processing"
        "OpenAI API key for AI features"
        "Google OAuth client ID for authentication"
        "Microsoft OAuth client ID for authentication"
        "GitHub OAuth client ID for authentication"
        "LinkedIn OAuth client ID for authentication"
    )
    secret_required=("true" "false" "false" "false" "false" "false" "false")
    secret_examples=(
        "sk_32_character_random_string"
        "sk_test_... or sk_live_..."
        "sk-..."
        "123456789-abc.apps.googleusercontent.com"
        "12345678-1234-1234-1234-123456789012"
        "Iv1.a1b2c3d4e5f6g7h8"
        "86abc12def34"
    )
    
    # Process each secret
    for i in "${!secret_names[@]}"; do
        secret_name="${secret_names[$i]}"
        description="${secret_descriptions[$i]}"
        required="${secret_required[$i]}"
        example="${secret_examples[$i]}"
        
        # Check if secret already exists
        if wrangler secret list --env production 2>/dev/null | grep -q "$secret_name"; then
            echo -e "${GREEN}✅ $secret_name is already configured${NC}"
            echo -n "Would you like to update it? (y/n): "
            read -r update_secret
            if [ "$update_secret" != "y" ] && [ "$update_secret" != "Y" ]; then
                continue
            fi
        fi
        
        secret_value=$(prompt_for_secret "$secret_name" "$description" "$required" "$example")
        
        if [ -n "$secret_value" ]; then
            set_secret "$secret_name" "$secret_value" "production"
        else
            echo -e "${YELLOW}⏭️  Skipping $secret_name${NC}"
        fi
    done
    
    echo ""
    echo -e "${GREEN}🎉 Secrets setup completed!${NC}"
    echo ""
    
    # Show current secrets (without values)
    echo -e "${BLUE}📋 Current production secrets:${NC}"
    wrangler secret list --env production
}

# Domain configuration helper
setup_domain_info() {
    echo ""
    echo -e "${BLUE}🌐 Domain Configuration Information${NC}"
    echo -e "${BLUE}===================================${NC}"
    echo ""
    echo -e "${YELLOW}To configure your custom domain 'care.brainsait.io':${NC}"
    echo ""
    echo "1. 📋 Go to Cloudflare Dashboard → DNS → Records"
    echo "2. ➕ Add a CNAME record:"
    echo "   • Name: care"
    echo "   • Target: brainsait-unified-prod.your-account.workers.dev"
    echo "   • Proxy status: Proxied (orange cloud)"
    echo ""
    echo "3. 🔧 Go to Workers & Pages → brainsait-unified-prod → Settings → Domains"
    echo "4. ➕ Add custom domain: care.brainsait.io"
    echo ""
    echo "5. 🔒 Enable SSL/TLS:"
    echo "   • Go to SSL/TLS → Overview"
    echo "   • Set encryption mode to 'Full (strict)'"
    echo ""
    echo "6. 🛡️  Configure security settings:"
    echo "   • Go to Security → Settings"
    echo "   • Enable 'Always Use HTTPS'"
    echo "   • Set minimum TLS version to 1.2"
    echo ""
    echo -e "${GREEN}✅ Your domain will be ready within a few minutes!${NC}"
}

# Show health check commands
show_health_check() {
    echo ""
    echo -e "${BLUE}🏥 Health Check Commands${NC}"
    echo -e "${BLUE}========================${NC}"
    echo ""
    echo "After deployment, test your app with:"
    echo ""
    echo "# Test worker health"
    echo "curl https://care.brainsait.io/health"
    echo ""
    echo "# Test API health"
    echo "curl https://care.brainsait.io/api/health"
    echo ""
    echo "# Monitor real-time logs"
    echo "wrangler tail --env production"
    echo ""
    echo "# Check security headers"
    echo "curl -I https://care.brainsait.io/"
}

# Main execution
main() {
    echo -e "${BLUE}🏥 BrainSAIT Unified Platform - Production Setup${NC}"
    echo ""
    
    case "${1:-setup}" in
        "setup"|"secrets")
            setup_secrets
            ;;
        "domain")
            setup_domain_info
            ;;
        "health")
            show_health_check
            ;;
        *)
            echo "Usage: $0 [setup|secrets|domain|health]"
            echo ""
            echo "Commands:"
            echo "  setup/secrets - Configure production secrets"
            echo "  domain        - Show domain configuration info"
            echo "  health        - Show health check commands"
            exit 1
            ;;
    esac
    
    if [ "${1:-setup}" = "setup" ]; then
        setup_domain_info
        show_health_check
    fi
}

# Run main function
main "$@"
