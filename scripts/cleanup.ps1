#!/bin/pwsh
# Script to cleanup HealthLinc project and prepare for deployment

# Store the current directory
$PROJECT_ROOT = "c:\Users\rcmrejection3\HealthLinc"
Set-Location $PROJECT_ROOT

Write-Host "🧹 Cleaning up HealthLinc project..." -ForegroundColor Cyan

# Remove temporary files
Write-Host "Removing temporary files and caches..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Include *.tmp, *.bak, *.pyc, *.log, *.cache -File | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "Removed: $($_.FullName)" -ForegroundColor Gray
}

# Clean up Python cache files
Write-Host "Cleaning Python cache..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "__pycache__" -Directory -Recurse | ForEach-Object {
    Remove-Item -Path $_.FullName -Recurse -Force
    Write-Host "Removed: $($_.FullName)" -ForegroundColor Gray
}

# Remove unnecessary directories
# SmoothWalker and Configuration directories are not part of the core HealthLinc project
Write-Host "Checking unnecessary directories..." -ForegroundColor Yellow
$dirs_to_check = @(
    "SmoothWalker",
    "SmoothWalker.xcodeproj",
    "Configuration"
)

foreach ($dir in $dirs_to_check) {
    if (Test-Path -Path "$PROJECT_ROOT\$dir") {
        Write-Host "⚠️ Detected unnecessary directory: $dir" -ForegroundColor Yellow
        Write-Host "This directory is not part of the core HealthLinc project."
        $choice = Read-Host "Remove it? (y/n)"
        if ($choice -eq "y") {
            Remove-Item -Path "$PROJECT_ROOT\$dir" -Recurse -Force
            Write-Host "Removed: $dir" -ForegroundColor Green
        } else {
            Write-Host "Kept: $dir" -ForegroundColor Gray
        }
    }
}

# Verify all required files are present
Write-Host "Verifying critical files..." -ForegroundColor Yellow
$critical_files = @(
    "docker-compose.yml",
    "backend\linc-agents\Dockerfile.multi",
    "backend\fhir-gateway\Dockerfile",
    "backend\linc-agents\authlinc\main.py",
    "backend\linc-agents\recordlinc\main.py",
    "backend\linc-agents\notifylinc\main.py",
    "backend\linc-agents\claimlinc\main.py",
    "frontend\patient-portal\Dockerfile",
    "frontend\clinician-portal\Dockerfile",
    "frontend\clinician-portal\.env.local"
)

$missing_files = @()
foreach ($file in $critical_files) {
    if (-Not (Test-Path -Path "$PROJECT_ROOT\$file")) {
        $missing_files += $file
    }
}

if ($missing_files.Length -gt 0) {
    Write-Host "❌ Missing critical files:" -ForegroundColor Red
    foreach ($file in $missing_files) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host "Please make sure all critical files are present before committing."
} else {
    Write-Host "✅ All critical files present!" -ForegroundColor Green
}

Write-Host "🎉 Cleanup complete!" -ForegroundColor Cyan
Write-Host "You can now commit and push your changes to the remote repository."
