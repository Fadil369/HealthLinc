// Security configuration for BrainSAIT Unified Platform
// Implements OWASP security recommendations and healthcare compliance

export interface SecurityConfig {
  cors: {
    production: string[];
    staging: string[];
    development: string[];
  };
  headers: {
    security: Record<string, string>;
    csp: string;
  };
  rateLimit: {
    api: number;
    auth: number;
    registration: number;
    passwordReset: number;
    upload: number;
    oauth: number;
  };
}

export const securityConfig: SecurityConfig = {
  cors: {
    production: [
      'https://care.brainsait.io',
      'https://www.care.brainsait.io',
      'https://brainsait.io',
      'https://www.brainsait.io'
    ],
    staging: [
      'https://staging-care.brainsait.io',
      'https://staging.brainsait.io'
    ],
    development: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ]
  },
  headers: {
    security: {
      // Prevent XSS attacks
      'X-XSS-Protection': '1; mode=block',
      
      // Prevent content type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevent iframe embedding (clickjacking protection)
      'X-Frame-Options': 'DENY',
      
      // Referrer policy for privacy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy (formerly Feature Policy)
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
      
      // Strict Transport Security (force HTTPS)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      
      // Cross-Origin policies
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      
      // Cache control for sensitive pages
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    csp: [
      "default-src 'self'",
      "script-src 'self' 'nonce-{nonce}' https://js.stripe.com https://maps.googleapis.com https://www.google.com https://apis.google.com",
      "style-src 'self' 'nonce-{nonce}' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://brainsait.io https://*.brainsait.io https://api.openai.com https://graph.microsoft.com https://login.microsoftonline.com https://api.github.com https://www.linkedin.com https://public-api.wordpress.com",
      "frame-src 'self' https://js.stripe.com https://www.google.com",
      "worker-src 'self' blob:",
      "child-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ].join('; ')
  },
  rateLimit: {
    api: 100,      // requests per minute for general API
    auth: 5,       // requests per minute for authentication (more restrictive)
    registration: 3, // requests per minute for user registration
    passwordReset: 2, // requests per minute for password reset
    upload: 5,     // requests per minute for file uploads
    oauth: 10      // requests per minute for OAuth endpoints
  }
};

export function getSecurityHeaders(environment: string = 'production'): Record<string, string> {
  const headers = { ...securityConfig.headers.security };
  
  // Add CSP header
  headers['Content-Security-Policy'] = securityConfig.headers.csp;
  
  // Environment-specific adjustments
  if (environment === 'development') {
    // Relax some restrictions for development
    delete headers['Strict-Transport-Security'];
    headers['Content-Security-Policy'] = headers['Content-Security-Policy']
      .replace("'unsafe-eval'", "'unsafe-eval' 'unsafe-inline'")
      .replace('upgrade-insecure-requests', '');
  }
  
  return headers;
}

export function getCorsOrigins(environment: string = 'production'): string[] {
  switch (environment) {
    case 'production':
      return securityConfig.cors.production;
    case 'staging':
      return securityConfig.cors.staging;
    case 'development':
      return securityConfig.cors.development;
    default:
      return securityConfig.cors.production;
  }
}
