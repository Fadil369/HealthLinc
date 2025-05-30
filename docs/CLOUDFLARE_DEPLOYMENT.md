# BrainSAIT Cloudflare Workers Deployment Guide

This guide will help you deploy BrainSAIT-Unified to Cloudflare Workers for optimal performance and scalability.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Workers Paid Plan**: Required for KV storage and Durable Objects
3. **Domain Setup**: Configure your domain in Cloudflare DNS
4. **Wrangler CLI**: Install globally with `npm install -g wrangler`

## Setup Steps

### 1. Authentication
```bash
wrangler login
```

### 2. Create KV Namespaces
```bash
# Production KV namespace
wrangler kv:namespace create "BRAINSAIT_KV" --preview false

# Staging KV namespace  
wrangler kv:namespace create "BRAINSAIT_KV" --preview true
```

Update the `wrangler.toml` file with the namespace IDs returned.

### 3. Create R2 Buckets
```bash
# Production storage bucket
wrangler r2 bucket create brainsait-storage

# Staging storage bucket
wrangler r2 bucket create brainsait-storage-preview
```

### 4. Set Environment Variables
```bash
# Set production environment variables
wrangler secret put JWT_SECRET --env production
wrangler secret put STRIPE_API_KEY --env production
wrangler secret put OPENAI_API_KEY --env production
# ... add all other secrets

# Set staging environment variables
wrangler secret put JWT_SECRET --env staging
# ... repeat for staging
```

### 5. Configure OAuth Redirect URLs

Update your OAuth provider settings to include:
- **Production**: `https://brainsait.com/auth/callback/{provider}`
- **Staging**: `https://staging.brainsait.com/auth/callback/{provider}`

Where `{provider}` is: `google`, `microsoft`, `github`, `linkedin`

### 6. Build and Deploy

#### Staging Deployment
```bash
npm run build
npm run deploy:staging
```

#### Production Deployment
```bash
npm run build
npm run deploy:production
```

### 7. Domain Configuration

In your Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to Settings > Triggers
4. Add custom domains:
   - Production: `brainsait.com`
   - Staging: `staging.brainsait.com`

## Architecture Overview

### Worker Components

1. **Main Worker** (`worker.ts`): Entry point and router
2. **API Handlers**: Authentication, Payments, AI Agents, ClaimLinc
3. **Static Handler**: Serves React SPA from KV storage
4. **Auth Session**: Durable Object for session management

### Storage

- **KV Store**: Static assets, cache, simple key-value data
- **R2 Bucket**: File uploads, documents, images
- **Durable Objects**: Session state, real-time features
- **Vectorize**: AI embeddings for search and recommendations

### Performance Optimizations

1. **Edge Caching**: Static assets cached at edge locations
2. **KV Storage**: Fast global key-value store for frequently accessed data
3. **Bundle Optimization**: Code splitting and tree shaking
4. **CDN Integration**: Global content delivery

## Monitoring & Analytics

### Built-in Monitoring
- Workers Analytics dashboard
- Real-time performance metrics
- Error tracking and logs

### Custom Analytics
```javascript
// Track custom events
await env.ANALYTICS.writeDataPoint({
  'event': 'user_login',
  'timestamp': Date.now(),
  'userId': user.id
});
```

## Database Migration

### From Docker to Workers

1. **Export Data**: Use existing scripts to export from SQLite/PostgreSQL
2. **Transform**: Convert to KV-compatible format
3. **Import**: Use Wrangler CLI to bulk import to KV
4. **Validate**: Test all functionality with migrated data

### Migration Script
```bash
# Export users from current database
python backend/auth/export_users.py > users.json

# Import to KV
wrangler kv:key put --binding=BRAINSAIT_KV "users" --path=users.json
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **CORS Configuration**: Restrict origins in production
3. **Rate Limiting**: Implement using Durable Objects
4. **JWT Validation**: Validate tokens on every request
5. **Input Sanitization**: Sanitize all user inputs

## Troubleshooting

### Common Issues

1. **KV Not Found**: Ensure namespace IDs are correct in wrangler.toml
2. **CORS Errors**: Check origin configuration in worker
3. **Build Errors**: Verify TypeScript configuration
4. **Deployment Fails**: Check Wrangler authentication

### Debug Commands
```bash
# View worker logs
wrangler tail --env production

# Test locally
wrangler dev

# Check KV contents
wrangler kv:key list --binding=BRAINSAIT_KV
```

## Performance Benchmarks

Expected performance with Cloudflare Workers:
- **Cold Start**: < 100ms
- **API Response**: < 50ms (cached)
- **Static Assets**: < 20ms (edge cache)
- **Global Latency**: < 200ms worldwide

## Cost Estimation

For a typical healthcare application:
- **Workers**: $5/month (100,000 requests/day)
- **KV Storage**: $0.50/month (1GB storage)
- **R2 Storage**: $0.015/month (1GB files)
- **Durable Objects**: $12.50/month (active sessions)

Total estimated cost: ~$18/month for moderate usage

## Support

For deployment issues:
1. Check Cloudflare Workers documentation
2. Review worker logs via `wrangler tail`
3. Test locally with `wrangler dev`
4. Contact support with specific error messages
