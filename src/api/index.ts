import { Hono } from 'hono';
import { authRoutes } from './auth';
import { agentsRoutes } from './agents';
import { claimlincRoutes } from './claimlinc';
import { paymentsRoutes } from './payments';
import healthflicksRoutes from './healthflicks';
import { Env } from '../worker';
import { createLogger } from '../utils/logger';

export function createAPIRoutes() {
  const api = new Hono<{ Bindings: Env }>();

  // Mount sub-routers
  api.route('/auth', authRoutes);
  api.route('/agents', agentsRoutes);
  api.route('/claimlinc', claimlincRoutes);
  api.route('/payments', paymentsRoutes);
  api.route('/healthflicks', healthflicksRoutes);

  // Health check for API
  api.get('/health', (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        auth: 'up',
        agents: 'up',
        claimlinc: 'up',
        payments: 'up',
        healthflicks: 'up'
      }
    });
  });

  // API documentation endpoint
  api.get('/docs', (c) => {
    return c.json({
      title: 'BrainSAIT Unified API',
      version: '1.0.0',
      description: 'Healthcare platform API with NPHIES integration',
      endpoints: {
        '/api/auth': 'Authentication and user management',
        '/api/agents': 'AI agent services (DocuLinc, ClaimLinc, etc.)',
        '/api/claimlinc': 'NPHIES insurance claims integration',
        '/api/payments': 'Payment processing and billing',
        '/api/healthflicks': 'TikTok-style health education videos'
      }
    });
  });

  // Add catch-all handler for non-existent API endpoints (including path traversal attempts)
  api.all('*', async (c) => {
    const logger = createLogger(c.req.raw, c.env);
    logger.security('api_endpoint_not_found', 'medium', undefined, undefined, {
      path: c.req.path,
      method: c.req.method,
      originalUrl: c.req.url
    });
    return c.json({ error: 'API endpoint not found' }, 404);
  });

  return api;
}
