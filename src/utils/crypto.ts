/**
 * Secure Cryptographic Utilities for BrainSAIT
 * 
 * Implements secure password hashing using PBKDF2 with salt
 * and other cryptographic operations following OWASP guidelines
 */

const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 32; // 256 bits
const HASH_LENGTH = 64; // 512 bits

export interface HashedPassword {
  hash: string;
  salt: string;
  iterations: number;
  algorithm: string;
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): string {
  const saltArray = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(saltArray);
  return Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using PBKDF2 with SHA-256
 */
export async function hashPassword(password: string, providedSalt?: string): Promise<HashedPassword> {
  const salt = providedSalt || generateSalt();
  const saltBytes = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8 // bits
  );
  
  const hash = Array.from(new Uint8Array(hashBuffer), byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
  
  return {
    hash,
    salt,
    iterations: PBKDF2_ITERATIONS,
    algorithm: 'PBKDF2-SHA256'
  };
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, stored: HashedPassword): Promise<boolean> {
  try {
    const computed = await hashPassword(password, stored.salt);
    
    // Use constant-time comparison to prevent timing attacks
    return constantTimeEqual(computed.hash, stored.hash);
  } catch (error) {
    console.error('Password verification failed');
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const tokenArray = new Uint8Array(length);
  crypto.getRandomValues(tokenArray);
  return Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure JWT secret
 */
export function generateJWTSecret(): string {
  return generateSecureToken(64); // 512 bits
}

/**
 * Validate password strength
 */
export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 1;
  }
  
  // Character variety checks
  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain lowercase letters');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain uppercase letters');
  } else {
    score += 1;
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('Password must contain numbers');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain special characters');
  } else {
    score += 1;
  }
  
  // Common password checks
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    feedback.push('Password contains common patterns');
    score = Math.max(0, score - 2);
  }
  
  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Password should not contain repeated characters');
    score = Math.max(0, score - 1);
  }
  
  const isValid = password.length >= 8 && score >= 3 && feedback.length === 0;
  
  return {
    isValid,
    score: Math.min(4, score),
    feedback
  };
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return generateSecureToken(24); // 192 bits
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
}

/**
 * Rate limiting key generation
 */
export function generateRateLimitKey(ip: string, endpoint: string, timeWindow: number = 60000): string {
  const windowStart = Math.floor(Date.now() / timeWindow) * timeWindow;
  return `rate_limit:${ip}:${endpoint}:${windowStart}`;
}