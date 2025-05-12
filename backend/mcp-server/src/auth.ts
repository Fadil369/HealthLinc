/**
 * Auth utilities for MCP Server
 */

export async function verifyToken(token: string, tokenStore: KVNamespace): Promise<boolean> {
  if (!token) return false;
  
  // Check if token exists in KV store
  const validToken = await tokenStore.get(token);
  return validToken !== null;
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.replace('Bearer ', '');
}

export function generateCorsHeaders(origin: string, allowedOrigins: string[]): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours
  });

  // Set the CORS origin header if it's allowed
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    headers.set('Access-Control-Allow-Origin', allowedOrigins[0] || '');
  }

  return headers;
}
