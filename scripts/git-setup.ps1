#!/bin/pwsh
# Script to initialize git repository and prepare for push

# Store the current directory
$PROJECT_ROOT = "c:\Users\rcmrejection3\HealthLinc"
Set-Location $PROJECT_ROOT

Write-Host "🚀 Initializing Git repository for HealthLinc..." -ForegroundColor Cyan

# Check if git is installed
try {
    $git_version = git --version
    Write-Host "Git detected: $git_version" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git before continuing." -ForegroundColor Red
    exit 1
}

# Initialize git repository if .git directory doesn't exist
if (-Not (Test-Path -Path "$PROJECT_ROOT\.git" -PathType Container)) {
    Write-Host "Initializing new Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized!" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists." -ForegroundColor Green
}

# Add all files to staging
Write-Host "Adding files to staging..." -ForegroundColor Yellow
git add .

# Show status
Write-Host "Current Git status:" -ForegroundColor Yellow
git status

# Ask user for commit message
$commit_message = Read-Host "Enter commit message (or press Enter for default message)"
if ([string]::IsNullOrEmpty($commit_message)) {
    $commit_message = "Initial commit of HealthLinc Ecosystem - Agentic RCM & EHR System"
}

# Commit changes
Write-Host "Committing changes with message: $commit_message" -ForegroundColor Yellow
git commit -m "$commit_message"

# Ask for remote repository URL
$remote_url = Read-Host "Enter remote repository URL (or press Enter to skip)"
if (-Not [string]::IsNullOrEmpty($remote_url)) {
    # Check if origin remote already exists
    $remote_exists = git remote -v | Select-String -Pattern "origin" -Quiet
    
    if ($remote_exists) {
        Write-Host "Origin remote already exists. Updating URL..." -ForegroundColor Yellow
        git remote set-url origin $remote_url
    } else {
        Write-Host "Adding remote repository..." -ForegroundColor Yellow
        git remote add origin $remote_url
    }
    
    # Push to remote
    $push_now = Read-Host "Push to remote repository now? (y/n)"
    if ($push_now -eq "y") {
        Write-Host "Pushing to remote repository..." -ForegroundColor Yellow
        git push -u origin main
    } else {
        Write-Host "To push to the remote repository later, run: git push -u origin main" -ForegroundColor Yellow
    }
} else {
    Write-Host "No remote repository URL provided. You can add one later with: git remote add origin YOUR_REPO_URL" -ForegroundColor Yellow
}

Write-Host "🎉 Git setup complete!" -ForegroundColor Cyan
