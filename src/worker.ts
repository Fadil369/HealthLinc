import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAPIRoutes } from './api/index';
import { createLogger } from './utils/logger';

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

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:5174', 'https://brainsait.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    debug: 'CHANGES_APPLIED'
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
      path = '/index.html';
    }
    
    const file = await c.env?.BRAINSAIT_KV?.get(`static:${path}`, { type: 'arrayBuffer' });
    
    if (file) {
      const mimeType = getMimeType(path);
      return new Response(file, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400', // 24 hours
        },
      });
    }
    
    // Fallback to index.html for SPA
    const indexFile = await c.env?.BRAINSAIT_KV?.get('static:/index.html', { type: 'arrayBuffer' });
    if (indexFile) {
      return new Response(indexFile, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Default landing page when no static files are uploaded
    const defaultHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BrainSAIT - AI-Powered Healthcare Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 800px;
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            font-size: 1.3em;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(5px);
        }
        .api-section {
            margin-top: 40px;
            text-align: left;
            background: rgba(0, 0, 0, 0.2);
            padding: 20px;
            border-radius: 15px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }
        .status {
            display: inline-block;
            background: #4ade80;
            color: #065f46;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 BrainSAIT</h1>
        <p class="subtitle">AI-Powered Healthcare Platform</p>
        <span class="status">🟢 LIVE</span>
        
        <div class="features">
            <div class="feature">
                <h3>🤖 AI Agent</h3>
                <p>Intelligent chat agent powered by Cloudflare AI with real-time capabilities</p>
            </div>
            <div class="feature">
                <h3>🔐 Authentication</h3>
                <p>Secure JWT-based authentication system for healthcare professionals</p>
            </div>
            <div class="feature">
                <h3>📊 Healthcare Tools</h3>
                <p>Comprehensive suite of tools for patient management and clinical workflows</p>
            </div>
            <div class="feature">
                <h3>⚡ Real-time</h3>
                <p>WebSocket support for instant communication and live updates</p>
            </div>
        </div>

        <div class="api-section">
            <h3>🔌 Available APIs</h3>
            <p><strong>Health Check:</strong> GET /health</p>
            <p><strong>Authentication:</strong> POST /api/auth/login</p>
            <p><strong>User Profile:</strong> GET /api/user/profile</p>
            <p><strong>AI Chat (REST):</strong> POST /api/chat/chat</p>
            <p><strong>AI Chat (WebSocket):</strong> WSS /api/chat/websocket</p>
            
            <h4>🧪 Test the AI Agent:</h4>
            <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; overflow-x: auto;">curl -X POST ${c.req.url}api/chat/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello AI!", "sessionId": "test"}'</pre>
        </div>
    </div>

    <script>
        // Display current timestamp
        document.addEventListener('DOMContentLoaded', function() {
            const now = new Date().toLocaleString();
            console.log('BrainSAIT Platform loaded at:', now);
        });
    </script>
</body>
</html>`;
    
    return new Response(defaultHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Static file serving error', error instanceof Error ? error : new Error(String(error)), {
      operation: 'static_file_serving'
    });
    return c.text('Internal Server Error', 500);
  }
});

function createAPIRoutes() {
  const api = new Hono<{ Bindings: Env }>();
  
  // Auth routes
  api.post('/auth/login', async (c) => {
    try {
      const body: any = await c.req.json();
      const { email, password } = body;
      
      // Simple mock authentication for now
      if (email === 'admin@brainsait.com' && password === 'Admin123!') {
        const secret = c.env?.JWT_SECRET || 'default-secret-for-dev';
        const token = await generateJWT({ userId: '1', email }, secret);
        return c.json({ 
          access_token: token, 
          token_type: 'bearer',
          user: {
            id: '1',
            email: 'admin@brainsait.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            isVerified: true
          }
        });
      }
      
      return c.json({ error: 'Invalid credentials' }, 401);
    } catch (error) {
      const logger = createLogger(c.req.raw, c.env);
      logger.auth('mock_login_failed', undefined, false);
      logger.error('Mock login error', error instanceof Error ? error : new Error(String(error)), {
        operation: 'mock_login'
      });
      return c.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
  
  api.get('/user/profile', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Mock user profile
    return c.json({
      id: '1',
      email: 'admin@brainsait.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isVerified: true,
      subscription: {
        tier: 'enterprise',
        status: 'active',
        currentPeriodEnd: '2025-12-31T23:59:59Z'
      }
    });
  });
  
  // Chat AI routes - using Durable Objects
  api.all('/chat/*', async (c) => {
    try {
      const chatId = c.req.query('chatId') || 'default';
      const durableObjectId = c.env.CHAT.idFromName(chatId);
      const chatStub = c.env.CHAT.get(durableObjectId);
      
      // Forward the request to the Durable Object
      const url = new URL(c.req.url);
      url.pathname = url.pathname.replace('/api/chat', '');
      
      return await chatStub.fetch(new Request(url.toString(), {
        method: c.req.method,
        headers: c.req.headers,
        body: c.req.method !== 'GET' ? c.req.body : undefined,
      }));
    } catch (error) {
      console.error('Chat error:', error);
      return c.json({ 
        error: 'Chat service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  return api;
}

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

async function generateJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = { ...payload, iat: now, exp: now + 86400 }; // 24 hours
  
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '');
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
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
      });

      return {
        response: aiResponse.response || 'I received your message but couldn\'t generate a response.',
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
