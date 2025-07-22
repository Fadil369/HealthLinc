/// <reference types="@cloudflare/workers-types" />

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAPIRoutes } from './api/index';
import { getSecurityHeaders, getCorsOrigins } from './utils/security';

export interface Env {
  // KV Namespace for caching and sessions
  BRAINSAIT_KV: KVNamespace;
  
  // Durable Objects
  CHAT: DurableObjectNamespace;
  
  // AI binding
  AI: Ai;
  
  // Environment variables
  NODE_ENV: string;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  MICROSOFT_CLIENT_ID?: string;
  GITHUB_CLIENT_ID?: string;
  LINKEDIN_CLIENT_ID?: string;
  OPENAI_API_KEY?: string;
  
  // Index signature for compatibility
  [key: string]: any;
}

const app = new Hono<{ Bindings: Env }>();

// Security middleware - apply security headers to all responses
app.use('*', async (c, next) => {
  const environment = c.env?.NODE_ENV || 'production';
  const securityHeaders = getSecurityHeaders(environment);
  
  await next();
  
  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    c.res.headers.set(key, value);
  });
});

// CORS middleware with environment-specific origins
app.use('*', async (c, next) => {
  const environment = c.env?.NODE_ENV || 'production';
  const allowedOrigins = getCorsOrigins(environment);
  
  return cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-API-Key'
    ],
    exposeHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    credentials: true,
    maxAge: 86400 // 24 hours
  })(c, next);
});

// Rate limiting middleware (basic implementation)
app.use('/api/*', async (c, next) => {
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const rateLimitKey = `rate_limit:${clientIP}:${Math.floor(Date.now() / 60000)}`;
  
  try {
    const current = await c.env?.BRAINSAIT_KV?.get(rateLimitKey);
    const count = current ? parseInt(current) : 0;
    
    if (count >= 100) { // 100 requests per minute
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    
    await c.env?.BRAINSAIT_KV?.put(rateLimitKey, (count + 1).toString(), { expirationTtl: 60 });
    
    c.res.headers.set('X-Rate-Limit-Remaining', (100 - count - 1).toString());
  } catch (error) {
    console.warn('Rate limiting error:', error);
  }
  
  await next();
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env?.NODE_ENV || 'development'
  });
});

// API routes
app.route('/api', createAPIRoutes());

// Static file serving (for SPA)
app.get('*', async (c) => {
  try {
    // Try to serve static files from KV
    const url = new URL(c.req.url);
    let path = url.pathname;
    
    // Reject suspicious paths that look like system files or traversal attempts
    const suspiciousPaths = [
      '/etc/', '/passwd', '/admin/', '/secret', '/root/', '/home/',
      '/var/', '/tmp/', '/proc/', '/sys/', '/boot/', '/usr/bin/',
      '/windows/', '/system32/', '..', 'admin', 'secret'
    ];
    
    if (suspiciousPaths.some(suspicious => path.toLowerCase().includes(suspicious.toLowerCase()))) {
      return c.json({ error: 'Not Found' }, 404);
    }
    
    // Default to index.html for SPA routing
    if (path === '/' || !path.includes('.')) {
      path = 'index.html';
    } else {
      // Remove leading slash for KV key format
      path = path.startsWith('/') ? path.slice(1) : path;
    }
    
    const file = await c.env?.BRAINSAIT_KV?.get(`static:${path}`, { type: 'arrayBuffer' });
    
    if (file) {
      const mimeType = getMimeType(path);
      const isHTML = mimeType === 'text/html';
      
      const headers: Record<string, string> = {
        'Content-Type': mimeType,
      };
      
      // Different caching strategies for different file types
      if (isHTML) {
        // HTML files should not be cached for SPA routing
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      } else {
        // Static assets can be cached with ETag
        headers['Cache-Control'] = 'public, max-age=31536000, immutable'; // 1 year for static assets
        headers['ETag'] = `"${await getFileHash(file)}"`;
      }
      
      return new Response(file, { headers });
    }
    
    // Fallback to index.html for SPA
    const indexFile = await c.env?.BRAINSAIT_KV?.get('static:index.html', { type: 'arrayBuffer' });
    if (indexFile) {
      return new Response(indexFile, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    }
    
    // Default landing page when no static files are uploaded
    const defaultHTML = getDefaultLandingPage();
    return new Response(defaultHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
  } catch (error) {
    console.error('Static file serving error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Helper function to get MIME type
function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

// Helper function to generate file hash for ETag
async function getFileHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// Default landing page
function getDefaultLandingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BrainSAIT - AI-Powered Healthcare Platform</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        .subtitle {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 2rem;
            backdrop-filter: blur(10px);
        }
        .feature h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #ffd700;
        }
        .status {
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.4);
            border-radius: 8px;
            padding: 1rem;
            margin: 2rem 0;
        }
        .status-indicator {
            width: 12px;
            height: 12px;
            background: #22c55e;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .cta {
            margin-top: 2rem;
        }
        .btn {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .api-docs {
            margin-top: 3rem;
            text-align: left;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 2rem;
        }
        .api-endpoint {
            margin: 1rem 0;
            font-family: 'Monaco', 'Menlo', monospace;
            background: rgba(0, 0, 0, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            h1 { font-size: 2.5rem; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 BrainSAIT</h1>
        <p class="subtitle">AI-Powered Healthcare Platform for Saudi Arabia</p>
        
        <div class="status">
            <span class="status-indicator"></span>
            <strong>System Status:</strong> Operational | Cloudflare Workers Deployment Active
        </div>

        <div class="features">
            <div class="feature">
                <h3>🏥 Healthcare Management</h3>
                <p>Complete patient records, appointment scheduling, and clinical documentation with AI assistance.</p>
            </div>
            <div class="feature">
                <h3>📡 NPHIES Integration</h3>
                <p>Seamless integration with Saudi Arabia's National Platform for Health Information Exchange Services.</p>
            </div>
            <div class="feature">
                <h3>🤖 AI Agents</h3>
                <p>Specialized AI assistants for documentation, claims processing, and analytics.</p>
            </div>
            <div class="feature">
                <h3>💼 RCM Optimization</h3>
                <p>Revenue Cycle Management with AI-driven insights and optimization.</p>
            </div>
        </div>

        <div class="cta">
            <a href="/api/docs" class="btn">📖 API Documentation</a>
            <a href="/api/health" class="btn">🔍 Health Check</a>
        </div>

        <div class="api-docs">
            <h3>🔗 API Endpoints</h3>
            <div class="api-endpoint">GET /api/health - System health check</div>
            <div class="api-endpoint">POST /api/auth/login - User authentication</div>
            <div class="api-endpoint">GET /api/agents - Available AI agents</div>
            <div class="api-endpoint">POST /api/claimlinc/claims/submit - Submit insurance claims</div>
            <div class="api-endpoint">GET /api/payments/plans - Subscription plans</div>
        </div>
    </div>
</body>
</html>`;
}

// Chat Durable Object for AI agent functionality
export class Chat {
  constructor(private ctx: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      // Handle WebSocket connections for real-time chat
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      // Create WebSocket pair
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      // Accept the WebSocket connection
      this.ctx.acceptWebSocket(server);
      
      return new Response(null, {
        status: 101,
        webSocket: client,
      } as any);
    }

    if (url.pathname === '/chat' && request.method === 'POST') {
      // Handle REST API chat messages
      try {
        const body = await request.json() as { message: string; sessionId?: string };
        const response = await this.processMessage(body.message, body.sessionId);
        
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to process request',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }

  // Handle WebSocket messages through Durable Object lifecycle methods
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const messageStr = typeof message === 'string' ? message : new TextDecoder().decode(message);
      const data = JSON.parse(messageStr);
      const response = await this.processMessage(data.message, data.sessionId);
      ws.send(JSON.stringify(response));
    } catch (error) {
      ws.send(JSON.stringify({ 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log('WebSocket connection closed', { code, reason, wasClean });
  }

  private async processMessage(message: string, sessionId?: string): Promise<any> {
    try {
      // Use Cloudflare AI to process the message
      if (!this.env.AI) {
        throw new Error('AI binding not available');
      }

      // For now, use a simple chat completion
      const aiResponse = await this.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for BrainSAIT, a healthcare platform. Provide helpful, accurate, and professional responses.' },
          { role: 'user', content: message }
        ]
      }) as any;

      return {
        response: aiResponse?.response || aiResponse?.generated_text || 'I received your message but couldn\'t generate a response.',
        sessionId: sessionId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'success'
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        error: 'I apologize, but I\'m having trouble processing your message right now. Please try again.',
        sessionId: sessionId || Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default app;
