# 🚀 BrainSAIT-Unified Deployment Guide

Complete deployment guide for the BrainSAIT-Unified healthcare platform on Cloudflare Workers.

## 📋 Prerequisites

- Node.js 18+ installed
- Cloudflare account with Workers plan
- Domain name (optional, for custom domains)

## 🛠️ Quick Setup

### 1. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Install Wrangler CLI globally
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Set Up Environment

```bash
# Set up development environment
npm run setup

# Or for production
npm run setup:production
```

This will guide you through setting up required secrets:
- `JWT_SECRET` - Secret key for JWT token signing
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NPHIES_CLIENT_ID` - NPHIES client ID for Saudi insurance
- `NPHIES_CLIENT_SECRET` - NPHIES client secret
- `STRIPE_SECRET_KEY` - Stripe secret key for payments

### 4. Build and Deploy

```bash
# Build the project
npm run build

# Upload static assets to KV
npm run upload:assets

# Deploy to development
npm run deploy

# Deploy to production
npm run deploy:production
```

## 🏗️ Build Process

The build process consists of two main steps:

1. **Frontend Build** (`npm run build:frontend`)
   - Builds React app with Vite
   - Optimizes with code splitting
   - Generates static assets in `frontend/dist/`

2. **Worker Build** (`npm run build:worker`)
   - Compiles TypeScript worker code
   - Bundles with Webpack
   - Outputs to `dist/worker.js`

## 📦 Static Asset Management

Static assets are served from Cloudflare KV:

```bash
# Upload all frontend assets
npm run upload:assets
```

Assets are stored with keys like:
- `static:index.html`
- `static:assets/index-abc123.js`
- `static:assets/index-def456.css`

## 🔧 Environment Configuration

### Development

```bash
# Start local development
npm run dev:worker

# Watch logs
npm run tail
```

### Staging

```bash
# Deploy to staging
npm run deploy:staging

# Watch staging logs
npm run tail:staging
```

### Production

```bash
# Full production deployment
npm run deploy:production

# Watch production logs
npm run tail:production
```

## 🔐 Secrets Management

### Required Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `JWT_SECRET` | JWT signing key (32+ chars) | `your-super-secret-key` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `NPHIES_CLIENT_ID` | NPHIES client ID | `your-client-id` |
| `NPHIES_CLIENT_SECRET` | NPHIES client secret | `your-client-secret` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |

### Managing Secrets

```bash
# List current secrets
npm run secrets:list

# Set a secret
wrangler secret put SECRET_NAME --env production

# Delete a secret
wrangler secret delete SECRET_NAME --env production
```

## 🗄️ KV Namespace Setup

KV namespaces store static files and cache data:

```bash
# List KV namespaces
npm run kv:list

# Create new namespace
wrangler kv namespace create "BRAINSAIT_KV" --env production
```

Update `wrangler.toml` with the returned namespace ID.

## 🌐 Custom Domains

To use a custom domain:

1. **Update `wrangler.toml`**:
   ```toml
   [env.production.route]
   pattern = "yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

2. **Configure DNS**:
   - Add your domain to Cloudflare
   - Create CNAME or A record pointing to your Worker

3. **Deploy**:
   ```bash
   npm run deploy:production
   ```

## 🧪 Testing

### API Tests

```bash
# Run API tests against local worker
npm run test:api

# Test against production
TEST_URL=https://your-domain.com npm run test:api
```

### Health Checks

```bash
# Check local health
npm run health

# Manual health check
curl https://your-worker.workers.dev/api/health
```

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
npm run tail

# Production logs
npm run tail:production

# Filter logs
wrangler tail --format pretty --status error
```

### Performance Monitoring

- **Cloudflare Dashboard**: View metrics, analytics, and performance
- **Workers Analytics**: Monitor request volume and latency
- **Real User Monitoring**: Track user experience metrics

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

2. **Secret Not Found**
   ```bash
   # Verify secrets are set
   npm run secrets:list
   ```

3. **KV Assets Not Loading**
   ```bash
   # Re-upload assets
   npm run upload:assets
   ```

4. **CORS Issues**
   - Check API routes have proper CORS headers
   - Verify domain configuration

### Debug Mode

```bash
# Enable debug logging
wrangler dev --local --debug

# Verbose deployment
wrangler deploy --env production --debug
```

## 📁 Project Structure

```
BrainSAIT-Unified/
├── src/                    # Worker source code
│   ├── worker-optimized.ts # Main worker entry
│   ├── api/               # API routes
│   └── auth/              # Authentication
├── frontend/              # React frontend
│   ├── src/               # Frontend source
│   └── dist/              # Built assets
├── scripts/               # Deployment scripts
│   ├── deploy-production.sh
│   ├── setup-environment.sh
│   └── upload-assets.sh
├── test/                  # Tests
└── wrangler.toml         # Cloudflare config
```

## 🎯 API Endpoints

- `GET /api/health` - Health check
- `GET /api/docs` - API documentation
- `POST /api/auth/login` - User authentication
- `GET /api/agents/chat` - AI chat interface
- `POST /api/claimlinc/submit` - Submit insurance claims
- `GET /api/payments/plans` - Subscription plans

## 🚀 Performance Optimization

### Bundle Size

- Frontend: ~267KB main bundle (gzipped)
- Worker: ~55KB (minified)

### Caching Strategy

- Static assets: 1 year cache
- API responses: 1 hour cache
- User data: No cache

### Code Splitting

Frontend is split into optimized chunks:
- Main app bundle
- Vendor libraries
- Route-based chunks
- Component libraries

## 📞 Support

For deployment issues:

1. Check [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
2. Review build logs for errors
3. Verify all secrets are configured
4. Test API endpoints individually

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm run install:all
      - run: npm run build
      - run: npm run upload:assets
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: production
```

---

🎉 **Congratulations!** Your BrainSAIT-Unified platform is now deployed and ready to serve healthcare providers across Saudi Arabia with AI-powered tools and NPHIES integration.
