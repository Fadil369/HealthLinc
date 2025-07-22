/**
 * Cloudflare Worker for AuthLinc Agent
 * Wraps the Python FastAPI application for Cloudflare Workers environment
 */

import { Router } from 'itty-router';

// Create router
const router = Router();

// In-memory user store for demo (use KV/D1 in production)
const DEMO_USERS = {
  "doctor": {
    user_id: "DR-12345678",
    username: "doctor",
    password_hash: "$2b$12$demo_hash", // bcrypt hash of "doctor123"
    role: "doctor",
    email: "doctor@healthlinc.app",
    first_name: "Jane",
    last_name: "Smith",
    organization_id: "ORG-GENERAL"
  },
  "patient": {
    user_id: "PT-87654321", 
    username: "patient",
    password_hash: "$2b$12$demo_hash", // bcrypt hash of "patient123"
    role: "patient",
    email: "patient@example.com",
    first_name: "John",
    last_name: "Doe",
    organization_id: null
  }
};

// JWT functions (simplified for demo)
async function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = await signHMAC(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function signHMAC(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyPassword(plain, hash) {
  // Simplified password verification (use proper bcrypt in production)
  return plain === "doctor123" && hash.includes("demo_hash") ||
         plain === "patient123" && hash.includes("demo_hash");
}

// Authentication endpoints
router.post('/agents/auth', async (request, env) => {
  try {
    const task = request.headers.get('X-MCP-Task');
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    const data = await request.json();

    console.log(`AuthLinc Task: ${task}, Request ID: ${requestId}`);

    const response = {
      status: 'success',
      timestamp: Date.now()
    };

    switch (task) {
      case 'login':
        const { username, password } = data;
        const user = DEMO_USERS[username];
        
        if (!user || !(await verifyPassword(password, user.password_hash))) {
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Invalid credentials',
            timestamp: Date.now()
          }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const accessToken = await createJWT({
          sub: user.user_id,
          username: user.username,
          role: user.role,
          organization_id: user.organization_id,
          exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
        }, env.JWT_SECRET || 'default-secret');

        const refreshToken = await createJWT({
          sub: user.user_id,
          username: user.username,
          role: user.role,
          type: 'refresh',
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        }, env.JWT_SECRET || 'default-secret');

        response.data = {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            organization_id: user.organization_id
          }
        };
        response.message = 'Login successful';
        break;

      case 'register':
        const userData = data;
        const userId = `${userData.role.toUpperCase().slice(0, 2)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        
        // In production, save to KV/D1
        response.data = {
          user_id: userId,
          access_token: await createJWT({
            sub: userId,
            username: userData.username,
            role: userData.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
          }, env.JWT_SECRET || 'default-secret'),
          refresh_token: await createJWT({
            sub: userId,
            username: userData.username,
            role: userData.role,
            type: 'refresh',
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
          }, env.JWT_SECRET || 'default-secret'),
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            user_id: userId,
            username: userData.username,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
            organization_id: userData.organization_id
          }
        };
        response.message = 'User registered successfully';
        break;

      case 'validate':
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Invalid or missing token',
            timestamp: Date.now()
          }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Simple token validation (implement proper JWT verification in production)
        response.data = {
          user_id: 'DR-12345678',
          username: 'doctor',
          role: 'doctor',
          organization_id: 'ORG-GENERAL'
        };
        response.message = 'Token is valid';
        break;

      case 'logout':
        response.message = 'Logged out successfully';
        break;

      default:
        return new Response(JSON.stringify({
          status: 'error',
          message: `Unknown task: ${task}`,
          timestamp: Date.now()
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(response), {
      status: task === 'register' ? 201 : 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: `Internal server error: ${error.message}`,
      timestamp: Date.now()
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'AuthLinc',
    timestamp: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json' } });
});

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env);
  }
};
