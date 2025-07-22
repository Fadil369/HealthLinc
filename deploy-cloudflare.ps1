# HealthLinc Cloudflare Workers Deployment Script for thefadil.site and brainsait.io
param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",
    [Parameter(Mandatory=$false)]
    [switch]$SetupKV,
    [Parameter(Mandatory=$false)]
    [switch]$DeployAll,
    [Parameter(Mandatory=$false)]
    [string]$Service = "all"
)

Write-Host "🚀 HealthLinc Cloudflare Workers Deployment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Zones: thefadil.site, brainsait.io" -ForegroundColor Cyan

# Check if Wrangler is installed
try {
    $wranglerVersion = npx wrangler --version
    Write-Host "✅ Wrangler CLI detected: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler CLI not found. Installing..." -ForegroundColor Red
    npm install -g @cloudflare/wrangler
}

# Function to setup KV namespaces
function Setup-KVNamespaces {
    Write-Host "🗃️ Setting up KV Namespaces..." -ForegroundColor Yellow
    
    $kvNamespaces = @(
        "healthlinc-tokens-prod",
        "healthlinc-logs-prod", 
        "nphies-messages-prod",
        "auth-sessions-prod",
        "claims-data-prod"
    )
    
    foreach ($namespace in $kvNamespaces) {
        Write-Host "Creating KV namespace: $namespace" -ForegroundColor Gray
        try {
            npx wrangler kv:namespace create $namespace
        } catch {
            Write-Host "⚠️ KV namespace $namespace may already exist" -ForegroundColor Yellow
        }
    }
}

# Function to deploy a specific service
function Deploy-Service($servicePath, $serviceName) {
    Write-Host "🔧 Deploying $serviceName..." -ForegroundColor Blue
    
    if (Test-Path $servicePath) {
        Push-Location $servicePath
        try {
            # Deploy to production
            npx wrangler deploy --env production
            Write-Host "✅ $serviceName deployed successfully!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to deploy $serviceName" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
        Pop-Location
    } else {
        Write-Host "⚠️ Service path not found: $servicePath" -ForegroundColor Yellow
    }
}

# Setup KV if requested
if ($SetupKV) {
    Setup-KVNamespaces
}

# Define services to deploy
$services = @{
    "mcp" = "backend\mcp-server"
    "authlinc" = "backend\linc-agents\authlinc"  
    "claimlinc" = "backend\linc-agents\claimlinc"
    "nphieslinc" = "backend\linc-agents\nphieslinc"
}

# Deploy services
if ($Service -eq "all" -or $DeployAll) {
    Write-Host "📦 Deploying all services..." -ForegroundColor Magenta
    
    foreach ($svc in $services.GetEnumerator()) {
        Deploy-Service $svc.Value $svc.Key
    }
} else {
    if ($services.ContainsKey($Service)) {
        Deploy-Service $services[$Service] $Service
    } else {
        Write-Host "❌ Unknown service: $Service" -ForegroundColor Red
        Write-Host "Available services: $($services.Keys -join ', ')" -ForegroundColor Gray
        exit 1
    }
}

# Custom domains setup instructions
Write-Host "`n🌐 Custom Domains Configuration:" -ForegroundColor Cyan
Write-Host "Add these DNS records to your Cloudflare zones:" -ForegroundColor Gray
Write-Host ""
Write-Host "For thefadil.site zone:" -ForegroundColor White
Write-Host "  api.thefadil.site -> CNAME to healthlinc-mcp.{your-subdomain}.workers.dev" -ForegroundColor Gray
Write-Host "  authlinc.thefadil.site -> CNAME to authlinc.{your-subdomain}.workers.dev" -ForegroundColor Gray
Write-Host "  claimlinc.thefadil.site -> CNAME to claimlinc.{your-subdomain}.workers.dev" -ForegroundColor Gray
Write-Host "  nphieslinc.thefadil.site -> CNAME to nphieslinc.{your-subdomain}.workers.dev" -ForegroundColor Gray
Write-Host ""
Write-Host "For brainsait.io zone:" -ForegroundColor White
Write-Host "  healthlinc.brainsait.io -> CNAME to healthlinc-mcp.{your-subdomain}.workers.dev" -ForegroundColor Gray
Write-Host "  nphies.brainsait.io -> CNAME to nphieslinc.{your-subdomain}.workers.dev" -ForegroundColor Gray
Write-Host "  claims.brainsait.io -> CNAME to claimlinc.{your-subdomain}.workers.dev" -ForegroundColor Gray

Write-Host "`n🎉 Deployment completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update DNS records in your Cloudflare dashboard" -ForegroundColor Gray
Write-Host "2. Test the endpoints" -ForegroundColor Gray
Write-Host "3. Update frontend configuration with new URLs" -ForegroundColor Gray
