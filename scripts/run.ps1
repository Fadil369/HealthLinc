#!/bin/pwsh
# Script to run the HealthLinc Ecosystem

# Store the current directory
$PROJECT_ROOT = "c:\Users\rcmrejection3\HealthLinc"
Set-Location $PROJECT_ROOT

Write-Host "🚀 Starting HealthLinc Ecosystem..." -ForegroundColor Cyan

# Check if Docker is installed
try {
    $docker_version = docker --version
    Write-Host "Docker detected: $docker_version" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker before continuing." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is installed
try {
    $compose_version = docker compose version
    Write-Host "Docker Compose detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Compose before continuing." -ForegroundColor Red
    exit 1
}

# Check for .env file
if (-Not (Test-Path -Path "$PROJECT_ROOT\.env")) {
    Write-Host "⚠️ No .env file found. Creating sample .env file..." -ForegroundColor Yellow
    
    @"
# HealthLinc Environment Variables
JWT_SECRET=healthlinc-dev-secret-change-in-production
NEXTAUTH_SECRET=healthlinc-nextauth-dev-secret
CLINICIAN_NEXTAUTH_SECRET=healthlinc-clinician-nextauth-dev-secret
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@healthlinc.app
SMTP_PASSWORD=change-in-production
"@ | Out-File -FilePath "$PROJECT_ROOT\.env" -Encoding UTF8
    
    Write-Host "✅ Created sample .env file. Please update with actual values." -ForegroundColor Green
}

# Environment selection
Write-Host "Select environment to start:" -ForegroundColor Yellow
Write-Host "1. Development (default)"
Write-Host "2. Production"

$env_choice = Read-Host "Enter choice (1-2)"
$compose_file = "docker-compose.yml"

if ($env_choice -eq "2") {
    $compose_file = "docker-compose.prod.yml"
    if (-Not (Test-Path -Path "$PROJECT_ROOT\$compose_file")) {
        Write-Host "⚠️ Production compose file not found. Using development compose file instead." -ForegroundColor Yellow
        $compose_file = "docker-compose.yml"
    }
}

# Start services
Write-Host "Starting HealthLinc services with $compose_file..." -ForegroundColor Yellow
docker compose -f $compose_file up -d

# Check if services are running
Start-Sleep -Seconds 5
Write-Host "Checking service status..." -ForegroundColor Yellow
docker compose -f $compose_file ps

# Show access information
Write-Host "`n📋 HealthLinc Ecosystem Access Information:" -ForegroundColor Cyan
Write-Host "- Patient Portal: http://localhost:3000"
Write-Host "- Clinician Portal: http://localhost:4000"
Write-Host "- FHIR Gateway: http://localhost:8000"
Write-Host "- ClaimLinc API: http://localhost:3001"
Write-Host "- RecordLinc API: http://localhost:3002"
Write-Host "- AuthLinc API: http://localhost:3003"
Write-Host "- NotifyLinc API: http://localhost:3004"

Write-Host "`nTo stop all services: docker compose -f $compose_file down" -ForegroundColor Yellow
Write-Host "To view logs: docker compose -f $compose_file logs -f" -ForegroundColor Yellow

Write-Host "`n🎉 HealthLinc Ecosystem is running!" -ForegroundColor Cyan
