// JWT session management for Cloudflare Workers
// Using Web Crypto API for signing and verification

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  exp?: number;
  iat?: number;
}

/**
 * Generate a JWT token using Web Crypto API
 */
export async function generateJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Add expiration and issued at timestamps
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(tokenPayload)).replace(/=/g, '');

  const signature = await sign(`${headerB64}.${payloadB64}`, secret);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const expectedSignature = await sign(`${headerB64}.${payloadB64}`, secret);
    const expectedSignatureB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature))).replace(/=/g, '');
    
    if (signatureB64 !== expectedSignatureB64) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadB64 + '='.repeat((4 - payloadB64.length % 4) % 4))) as JWTPayload;
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    // Don't log the actual error details to prevent token leakage
    console.error('JWT verification failed');
    return null;
  }
}

/**
 * Sign data using HMAC-SHA256
 */
async function sign(data: string, secret: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware for JWT authentication
 */
export async function authenticateJWT(authHeader: string | undefined, secret: string): Promise<JWTPayload | null> {
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return null;
  }
  
  return await verifyJWT(token, secret);
}
