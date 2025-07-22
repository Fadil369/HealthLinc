# Cloudflare Pages Configuration
# This file configures the build and deployment settings for HealthLinc frontend

[build]
  # Build command for the clinician portal
  command = "cd frontend/clinician-portal && npm install && npm run build"
  
  # Publish directory
  publish = "frontend/clinician-portal/out"

[build.environment]
  # Node.js version
  NODE_VERSION = "18"
  
  # Environment variables for build
  NEXT_PUBLIC_API_URL = "https://healthlinc-mcp.healthlinc.workers.dev"
  NEXT_PUBLIC_FHIR_API_URL = "https://fhir-gateway.healthlinc.workers.dev"
  NEXT_PUBLIC_NPHIES_API_URL = "https://nphies-integration.healthlinc.workers.dev"
  NEXT_PUBLIC_ENVIRONMENT = "production"

# Headers for security and CORS
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://healthlinc-mcp.healthlinc.workers.dev https://*.healthlinc.workers.dev;"

# API Routes - redirect to Workers
[[redirects]]
  from = "/api/mcp/*"
  to = "https://healthlinc-mcp.healthlinc.workers.dev/:splat"
  status = 200

[[redirects]]
  from = "/api/fhir/*"
  to = "https://fhir-gateway.healthlinc.workers.dev/:splat"
  status = 200

[[redirects]]
  from = "/api/nphies/*"
  to = "https://nphies-integration.healthlinc.workers.dev/:splat"
  status = 200

# SPA fallback for client-side routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin", "clinician"]}

# Functions for serverless API routes (optional)
[functions]
  directory = "functions"

# Preview environment settings
[preview]
  [preview.env]
    NEXT_PUBLIC_API_URL = "https://healthlinc-mcp.healthlinc-preview.workers.dev"
    NEXT_PUBLIC_ENVIRONMENT = "preview"
