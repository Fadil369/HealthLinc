# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

BrainSAIT Unified is a healthcare management platform built on Cloudflare Workers with a React frontend. The system follows a hybrid architecture combining microservices (for local development) and edge computing (for production deployment).

## Development Commands

### Primary Development
- `npm run dev` - Start frontend development server (port 3000)
- `npm run dev:local` - Start full local development stack with all services
- `npm run dev:worker` - Start Cloudflare Workers development server

### Building and Deployment
- `npm run build` - Build both frontend and worker
- `npm run build:frontend` - Build React frontend only
- `npm run build:worker` - Build Cloudflare Worker only
- `npm run deploy` - Deploy to default environment
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:production` - Deploy to production (uses script)

### Testing and Quality
- `npm run test` - Run frontend tests
- `npm run test:api` - Run API integration tests
- `npm run lint` - Lint frontend code
- `npm run lint:worker` - Lint worker TypeScript code
- `npm run typecheck` - TypeScript type checking

### Environment Management
- `npm run setup` - Setup development environment
- `npm run setup:production` - Setup production environment
- `npm run install:all` - Install dependencies for all workspaces

### Asset Management
- `npm run upload:assets` - Upload frontend assets to Cloudflare KV
- `npm run clean` - Clean build artifacts

### Monitoring
- `npm run tail` - View worker logs (development)
- `npm run tail:production` - View production worker logs
- `npm run health` - Check worker health endpoint

### Additional Scripts
- `./scripts/run_tests.sh` - Complete test suite
- `./scripts/build.sh` - Full build process
- `./scripts/deploy.sh` - Deployment script
- `./scripts/dev-local.sh` - Local development with Docker

## Architecture Overview

### Frontend (React/TypeScript)
- **Location**: `/frontend/`
- **Framework**: React 18 with TypeScript, Vite build system
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router for SPA navigation
- **State Management**: React Context for auth, theme, language, payments
- **Key Components**: Dashboard, patient management, claims processing, telehealth

### Backend (Cloudflare Workers)
- **Location**: `/src/`
- **Framework**: Hono web framework on Cloudflare Workers
- **Main Entry**: `src/worker.ts`
- **API Routes**: `src/api/` - modular API endpoints
- **Architecture**: Edge-first with KV storage, AI integration, Durable Objects for chat

### Microservices (Local Development)
- **Location**: `/backend/`
- **Services**: 
  - `gateway/` - API gateway and routing
  - `auth/` - Authentication service with SQLite
  - `claimlinc/` - NPHIES integration for insurance claims
  - `agents/` - AI agent services
  - `payments/` - Payment processing
- **Orchestration**: Docker Compose with health checks
- **Databases**: Redis, ChromaDB, HAPI FHIR server

### Infrastructure
- **Local**: Docker Compose for development
- **Production**: Cloudflare Workers, KV storage, AI bindings
- **Monitoring**: Built-in health checks and logging
- **Static Assets**: Served from KV namespace

## Key Integration Points

### NPHIES Healthcare Integration
- Saudi Arabian healthcare insurance platform integration
- Claims submission, eligibility verification, status tracking
- Located in `backend/claimlinc/` service and frontend claims pages

### AI Capabilities
- Cloudflare AI integration via Workers AI binding
- Chat functionality using Durable Objects for session management
- AI agents for clinical documentation, claims optimization

### Authentication Flow
- JWT-based authentication with support for OAuth providers
- Session management via KV storage
- Protected routes in React frontend

### Payment Processing
- Stripe integration for subscription management
- Payment context and components in frontend
- Dedicated payments microservice

## Development Workflow

1. **Local Development**: Use `npm run dev:local` to start all services via Docker
2. **Frontend Only**: Use `npm run dev` for frontend-only development
3. **Workers Development**: Use `npm run dev:worker` for edge function testing
4. **Testing**: Run `npm run test` and `npm run test:api` before commits
5. **Deployment**: Use staging environment before production deployments

## Environment Configuration

### Required Environment Variables
- `JWT_SECRET` - Authentication secret
- `NPHIES_CLIENT_ID`, `NPHIES_CLIENT_SECRET` - Saudi healthcare integration
- `STRIPE_SECRET_KEY` - Payment processing
- `OPENAI_API_KEY` - AI services (for local development)

### Cloudflare Configuration
- KV Namespace: `BRAINSAIT_KV` for caching and static assets
- AI Binding: `AI` for Cloudflare Workers AI
- Environments: development, staging, production with separate configs

## Important Patterns

### API Structure
- REST APIs follow `/api/{service}/{endpoint}` pattern
- Error handling with consistent JSON error responses
- CORS configured for cross-origin requests

### Frontend Architecture
- Context providers for global state (auth, theme, language)
- Protected routes using AuthContext
- Consistent component structure with TypeScript interfaces

### Database Patterns
- SQLite for authentication service (local)
- Redis for caching and session storage
- KV storage for edge computing (production)
- ChromaDB for vector embeddings and AI features

## Social Authentication Setup

### OAuth Provider Configuration
The platform supports GitHub, LinkedIn, and Gravatar OAuth authentication. Use the following commands to configure production secrets:

```bash
# GitHub OAuth Configuration
npx wrangler secret put GITHUB_CLIENT_ID --env production
# value: Ov23liqV068KCxscpq7l

npx wrangler secret put GITHUB_CLIENT_SECRET --env production
# value: 658d96632c6fc9da24f8229c6c63c54854a2a7c7

# LinkedIn OAuth Configuration
npx wrangler secret put LINKEDIN_CLIENT_ID --env production
# value: 78nrbipf31tm67

npx wrangler secret put LINKEDIN_CLIENT_SECRET --env production
# value: WPL_AP1.4gUFLaf0SUUuxiRo.F8alPw==

# Gravatar OAuth Configuration
npx wrangler secret put GRAVATAR_CLIENT_ID --env production
# value: 103135

npx wrangler secret put GRAVATAR_CLIENT_SECRET --env production
# value: DunKjZRTpY1bKIXzmxXbF0Z2ZNVjnNxdST3UKOqDSYKu9Ccxqn7ltTEAU9pGNjKG
```

### OAuth Implementation Notes
- OAuth configuration is located in `frontend/src/config/oauth.ts`
- Social login handlers are implemented in `frontend/src/contexts/AuthContext.tsx:305-510`
- Production OAuth redirect URLs are configured in `wrangler.toml`
- All OAuth flows use popup-based authentication with proper error handling and loading states

### Signup Form Validation Strategy
The registration form (`frontend/src/pages/Register.tsx`) implements a 3-step progressive signup with basic validation. For enhanced security and UX, consider implementing:

1. **Real-time validation** with debounced async checks
2. **Password strength meters** with security recommendations
3. **Healthcare-specific validation** for medical licenses and professional credentials
4. **Accessibility improvements** with ARIA live regions and proper error announcements
5. **Input sanitization** and XSS prevention
6. **Rate limiting** and bot detection mechanisms

Current validation is basic (presence + password length). Upgrade to comprehensive validation including email format, password complexity, and professional credential verification for healthcare use cases.

## Logging Strategy

### Structured Logging Implementation
The platform uses a unified logging system (`src/utils/logger.ts`) optimized for Cloudflare Workers with:
- **JSON structured output** for better observability and parsing
- **Request correlation IDs** for tracing requests across services
- **Healthcare-specific compliance logging** with PHI/PII flags and retention policies
- **Environment-based log levels** (debug in dev, warn in production)
- **Specialized logging methods** for auth, NPHIES, payments, and security events

### Usage Examples
```typescript
// Import the logger
import { createLogger } from '../utils/logger';

// Create request-scoped logger
const logger = createLogger(c.req.raw, c.env);

// Healthcare-specific logging
logger.nphies('claim_submitted', claimId, 'success', { amount: 1500 });
logger.auth('login_success', userId, true);
logger.payment('subscription_created', 299, 'SAR', userId);
logger.security('failed_login_attempt', 'medium', userAgent, ip);

// General logging with context
logger.error('Database connection failed', error, {
  operation: 'db_connect',
  userId: 'user_123'
});
```

### Log Structure
All logs follow a consistent JSON structure:
```json
{
  "@timestamp": "2025-05-30T10:30:00.000Z",
  "level": "INFO",
  "message": "NPHIES claim submitted",
  "service": "brainsait-unified",
  "requestId": "req_1234567890",
  "userId": "user_123",
  "operation": "nphies_claim_submit",
  "compliance": {
    "phi": true,
    "audit": true,
    "retention": 2555
  }
}
```

### Migration from console.log
All `console.log`, `console.error`, etc. calls have been replaced with structured logging. Use the logger factory for new code:
- Replace `console.error('msg', error)` with `logger.error('msg', error)`
- Add contextual information for better debugging and compliance
- Use specialized methods for domain-specific events (auth, payments, NPHIES)