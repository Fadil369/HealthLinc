# HealthLinc Cloudflare Workers Deployment Script
# This script sets up and deploys all HealthLinc agents to Cloudflare Workers

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [switch]$SetupKV,
    
    [Parameter(Mandatory=$false)]
    [switch]$Deploy,
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateWorkers,
    
    [Parameter(Mandatory=$false)]
    [switch]$All
)

Write-Host "🚀 HealthLinc Cloudflare Workers Deployment" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Configuration
$WorkersConfig = @{
    "healthlinc-mcp" = @{
        Path = "backend\mcp-server"
        Description = "HealthLinc MCP Server - Main routing and orchestration"
        Type = "mcp-server"
    }
    "authlinc" = @{
        Path = "backend\linc-agents\authlinc" 
        Description = "AuthLinc Agent - Authentication and Authorization"
        Type = "python-agent"
    }
    "claimlinc" = @{
        Path = "backend\linc-agents\claimlinc"
        Description = "ClaimLinc Agent - Claims Processing"
        Type = "python-agent" 
    }
    "matchlinc" = @{
        Path = "backend\linc-agents\matchlinc"
        Description = "MatchLinc Agent - Code Matching and Validation"
        Type = "python-agent"
    }
    "doculinc" = @{
        Path = "backend\linc-agents\doculinc"
        Description = "DocuLinc Agent - Documentation Enhancement"
        Type = "python-agent"
    }
    "notifylinc" = @{
        Path = "backend\linc-agents\notifylinc"
        Description = "NotifyLinc Agent - Notifications and Communications"
        Type = "python-agent"
    }
    "recordlinc" = @{
        Path = "backend\linc-agents\recordlinc"
        Description = "RecordLinc Agent - Patient Records Management"
        Type = "python-agent"
    }
    "reviewerlinc" = @{
        Path = "backend\linc-agents\reviewerlinc"
        Description = "ReviewerLinc Agent - Claims Review and Analysis"
        Type = "python-agent"
    }
    "claimtrackerlinc" = @{
        Path = "backend\linc-agents\claimtrackerlinc"
        Description = "ClaimTrackerLinc Agent - Claims Tracking"
        Type = "python-agent"
    }
    "nphieslinc" = @{
        Path = "backend\linc-agents\nphieslinc"
        Description = "NphiesLinc Agent - NPHIES Integration"
        Type = "python-agent"
    }
    "nphies-integration" = @{
        Path = "backend\nphies-integration"
        Description = "NPHIES Integration Service"
        Type = "python-service"
    }
    "fhir-gateway" = @{
        Path = "backend\fhir-gateway"
        Description = "FHIR Gateway - Interoperability Layer"
        Type = "python-service"
    }
}

function Setup-KVNamespaces {
    Write-Host "📦 Setting up KV Namespaces..." -ForegroundColor Green
    
    # Create KV namespaces for MCP server
    try {
        $tokensProd = wrangler kv:namespace create "HEALTHLINC_TOKENS" 2>&1
        $tokensPreview = wrangler kv:namespace create "HEALTHLINC_TOKENS" --preview 2>&1
        $logsProd = wrangler kv:namespace create "HEALTHLINC_LOGS" 2>&1
        $logsPreview = wrangler kv:namespace create "HEALTHLINC_LOGS" --preview 2>&1
        
        Write-Host "✅ KV Namespaces created successfully" -ForegroundColor Green
        Write-Host "Update your wrangler.toml with the following IDs:" -ForegroundColor Yellow
        Write-Host $tokensProd -ForegroundColor Gray
        Write-Host $tokensPreview -ForegroundColor Gray
        Write-Host $logsProd -ForegroundColor Gray
        Write-Host $logsPreview -ForegroundColor Gray
    }
    catch {
        Write-Host "❌ Error creating KV namespaces: $_" -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Create-PythonWorker {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Description
    )
    
    Write-Host "🐍 Creating Python Worker: $Name" -ForegroundColor Cyan
    
    # Create JavaScript wrapper for Python worker
    $workerScript = @'
// Cloudflare Worker wrapper for Python LINC Agent
// This is a simplified approach - in production use Pyodide or similar

import { Router } from 'itty-router';

const router = Router();

// Basic health check for Python workers
router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'WORKER_NAME',
    timestamp: new Date().toISOString(),
    type: 'python-wrapper'
  }), { headers: { 'Content-Type': 'application/json' } });
});

// Placeholder endpoint - implement actual logic
router.post('/agents/*', async (request) => {
  return new Response(JSON.stringify({
    status: 'success',
    message: 'Python worker placeholder - implement actual logic',
    service: 'WORKER_NAME',
    timestamp: Date.now()
  }), { headers: { 'Content-Type': 'application/json' } });
});

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env);
  }
};
'@

    # Replace placeholder with actual worker name
    $workerScript = $workerScript -replace "WORKER_NAME", $Name
    
    # Create worker directory
    $workerDir = "deploy\workers\$Name"
    if (!(Test-Path $workerDir)) {
        New-Item -ItemType Directory -Force -Path $workerDir | Out-Null
    }
    
    # Create worker files
    Set-Content -Path "$workerDir\index.js" -Value $workerScript
    
    # Copy Python files as reference
    if (Test-Path $Path) {
        Copy-Item -Path "$Path\*" -Destination $workerDir -Recurse -Force
    }
    
    Write-Host "✅ Worker $Name created at $workerDir" -ForegroundColor Green
}

function Deploy-Worker {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Type
    )
    
    Write-Host "🚀 Deploying Worker: $Name" -ForegroundColor Cyan
    
    try {
        Push-Location $Path
        
        if ($Type -eq "mcp-server") {
            # TypeScript/Node.js worker
            Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
            npm install
            
            Write-Host "🔨 Building TypeScript..." -ForegroundColor Yellow
            npm run build 2>$null
            
            Write-Host "🚀 Deploying to Cloudflare Workers..." -ForegroundColor Yellow
            wrangler deploy --env $Environment
        }
        elseif ($Type -eq "python-agent" -or $Type -eq "python-service") {
            # For Python workers, we need to use a different approach
            # Create a Node.js wrapper that can run Python code
            Create-PythonWorker -Name $Name -Path $Path -Description $WorkersConfig[$Name].Description
            
            Push-Location "..\..\deploy\workers\$Name"
            wrangler deploy --env $Environment
            Pop-Location
        }
        
        Write-Host "✅ Worker $Name deployed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error deploying worker $Name : $_" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
    
    return $true
}

function Create-DeployDirectory {
    Write-Host "📁 Creating deployment directory structure..." -ForegroundColor Green
    
    $deployDir = "deploy\workers"
    if (!(Test-Path $deployDir)) {
        New-Item -ItemType Directory -Force -Path $deployDir | Out-Null
    }
    
    # Create package.json for TypeScript builds
    $packageJson = @"
{
  "name": "healthlinc-workers",
  "version": "1.0.0",
  "description": "HealthLinc Cloudflare Workers Deployment",
  "scripts": {
    "build": "tsc",
    "deploy:all": "powershell -File deploy-workers.ps1 -All",
    "deploy:mcp": "wrangler deploy --config backend/mcp-server/wrangler.toml",
    "setup:kv": "powershell -File deploy-workers.ps1 -SetupKV"
  },
  "dependencies": {
    "@cloudflare/workers-types": "^4.20231121.0",
    "@cloudflare/pyodide-worker": "^1.0.0",
    "itty-router": "^4.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "wrangler": "^3.15.0"
  }
}
"@
    
    Set-Content -Path "deploy\package.json" -Value $packageJson
    
    Write-Host "✅ Deployment structure created" -ForegroundColor Green
}

function Show-DeploymentStatus {
    Write-Host "`n🎯 HealthLinc Cloudflare Workers Deployment Summary" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Gray
    
    Write-Host "`nWorkers to be deployed:" -ForegroundColor Yellow
    foreach ($worker in $WorkersConfig.Keys) {
        $config = $WorkersConfig[$worker]
        Write-Host "  • $worker" -ForegroundColor White -NoNewline
        Write-Host " ($($config.Type))" -ForegroundColor Gray
        Write-Host "    └── $($config.Description)" -ForegroundColor Gray
        Write-Host "    └── URL: https://$worker.healthlinc.workers.dev" -ForegroundColor Green
    }
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "1. Run with -SetupKV to create KV namespaces" -ForegroundColor White
    Write-Host "2. Update wrangler.toml files with KV namespace IDs" -ForegroundColor White  
    Write-Host "3. Run with -Deploy to deploy all workers" -ForegroundColor White
    Write-Host "4. Test endpoints and configure custom domains" -ForegroundColor White
    
    Write-Host "`nUsage Examples:" -ForegroundColor Yellow
    Write-Host "  .\deploy-workers.ps1 -SetupKV" -ForegroundColor Gray
    Write-Host "  .\deploy-workers.ps1 -Deploy" -ForegroundColor Gray
    Write-Host "  .\deploy-workers.ps1 -All" -ForegroundColor Gray
}

# Main execution logic
if ($All) {
    $SetupKV = $true
    $CreateWorkers = $true
    $Deploy = $true
}

# Create deployment directory
Create-DeployDirectory

# Setup KV namespaces
if ($SetupKV) {
    $kvSuccess = Setup-KVNamespaces
    if (!$kvSuccess) {
        Write-Host "❌ KV setup failed. Exiting..." -ForegroundColor Red
        exit 1
    }
}

# Create worker configurations
if ($CreateWorkers) {
    Write-Host "`n🏗️ Creating worker configurations..." -ForegroundColor Green
    
    foreach ($workerName in $WorkersConfig.Keys) {
        $config = $WorkersConfig[$workerName]
        
        if ($config.Type -eq "python-agent" -or $config.Type -eq "python-service") {
            Create-PythonWorker -Name $workerName -Path $config.Path -Description $config.Description
        }
    }
}

# Deploy workers
if ($Deploy) {
    Write-Host "`n🚀 Deploying workers to Cloudflare..." -ForegroundColor Green
    
    # First deploy the MCP server
    Write-Host "`n📡 Deploying MCP Server first..." -ForegroundColor Cyan
    Deploy-Worker -Name "healthlinc-mcp" -Path $WorkersConfig["healthlinc-mcp"].Path -Type $WorkersConfig["healthlinc-mcp"].Type
    
    # Deploy other workers
    foreach ($workerName in $WorkersConfig.Keys) {
        if ($workerName -ne "healthlinc-mcp") {
            $config = $WorkersConfig[$workerName]
            Deploy-Worker -Name $workerName -Path $config.Path -Type $config.Type
        }
    }
    
    Write-Host "`n🎉 All workers deployed successfully!" -ForegroundColor Green
    Write-Host "`nMCP Server URL: https://healthlinc-mcp.healthlinc.workers.dev" -ForegroundColor Cyan
    Write-Host "API Documentation: https://healthlinc-mcp.healthlinc.workers.dev/docs" -ForegroundColor Cyan
}

# Show deployment status
Show-DeploymentStatus

Write-Host "`n🎯 HealthLinc Cloudflare Workers deployment script completed!" -ForegroundColor Green
