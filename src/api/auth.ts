import { Hono } from 'hono';
import { Env } from '../worker';
import { generateJWT, verifyJWT } from '../auth/session';
import { createLogger } from '../utils/logger';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/crypto';
import { validateSchema, userRegistrationSchema, userLoginSchema, profileUpdateSchema } from '../utils/validation';

export const authRoutes = new Hono<{ Bindings: Env }>();

// User registration
authRoutes.post('/register', async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      const logger = createLogger(c.req.raw, c.env);
      logger.error('Invalid JSON in registration request', parseError instanceof Error ? parseError : new Error(String(parseError)));
      return c.json({ error: 'Invalid JSON in request body' }, 400);
    }
    
    // Validate and sanitize input using schema
    const validation = validateSchema(body || {}, userRegistrationSchema);
    if (!validation.isValid) {
      const logger = createLogger(c.req.raw, c.env);
      logger.security('invalid_registration_data', 'medium', undefined, undefined, {
        errors: validation.errors,
        ip: c.req.header('CF-Connecting-IP')
      });
      return c.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, 400);
    }

    const { email, password, firstName, lastName, role = 'user' } = validation.sanitizedData;

    // Additional password strength validation
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      return c.json({ 
        error: 'Password does not meet security requirements',
        details: passwordStrength.feedback
      }, 400);
    }

    // Check if user already exists (using KV store)
    const existingUser = await c.env.BRAINSAIT_KV.get(`user:${email}`);
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409);
    }

    // Hash password using secure PBKDF2
    const passwordHashData = await hashPassword(password);

    // Create user object
    const user = {
      id: crypto.randomUUID(),
      email,
      firstName,
      lastName,
      role,
      passwordHash: passwordHashData,
      isVerified: false,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null
    };

    // Store user in KV
    await c.env.BRAINSAIT_KV.put(`user:${email}`, JSON.stringify(user));
    await c.env.BRAINSAIT_KV.put(`user:id:${user.id}`, JSON.stringify(user));

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    // Return success (don't include password hash)
    const { passwordHash: _, ...userResponse } = user;
    return c.json({
      access_token: token,
      token_type: 'bearer',
      user: userResponse
    }, 201);

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('User registration failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'user_registration'
    });
    return c.json({ 
      error: 'Internal server error'
    }, 500);
  }
});

// User login
authRoutes.post('/login', async (c) => {
  try {
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      const logger = createLogger(c.req.raw, c.env);
      logger.error('Invalid JSON in login request', parseError instanceof Error ? parseError : new Error(String(parseError)));
      return c.json({ error: 'Invalid JSON in request body' }, 400);
    }
    
    // Validate input
    const validation = validateSchema(body || {}, userLoginSchema);
    if (!validation.isValid) {
      const logger = createLogger(c.req.raw, c.env);
      logger.security('invalid_login_data', 'medium', undefined, undefined, {
        errors: validation.errors,
        ip: c.req.header('CF-Connecting-IP')
      });
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const { email, password } = validation.sanitizedData;

    // Get user from KV store
    const userStr = await c.env.BRAINSAIT_KV.get(`user:${email}`);
    
    // Check demo credentials first
    if (email === 'admin@brainsait.com' && password === 'Admin123!') {
      const token = await generateJWT(
        { userId: '1', email, role: 'admin' },
        c.env.JWT_SECRET || 'default-secret-for-dev'
      );
      
      return c.json({
        access_token: token,
        token_type: 'bearer',
        user: {
          id: '1',
          email,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          isVerified: true
        }
      });
    }

    if (!userStr) {
      // Simulate password check to prevent timing attacks
      await hashPassword('dummy-password');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (parseError) {
      const logger = createLogger(c.req.raw, c.env);
      logger.error('Invalid user data in KV store', parseError instanceof Error ? parseError : new Error(String(parseError)));
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const logger = createLogger(c.req.raw, c.env);
      logger.security('account_locked_login_attempt', 'high', user.id, undefined, {
        email: user.email,
        ip: c.req.header('CF-Connecting-IP'),
        lockedUntil: user.lockedUntil
      });
      return c.json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts' 
      }, 423);
    }

    // Verify password using secure method
    let isValidPassword = false;
    
    // Handle both old and new password hash formats for migration
    if (typeof user.passwordHash === 'string') {
      // Old format - migrate to new format on successful login
      const legacyHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password + (c.env.JWT_SECRET || 'default-secret-for-dev'))
      );
      const legacyHashHex = Array.from(new Uint8Array(legacyHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (user.passwordHash === legacyHashHex) {
        isValidPassword = true;
        // Migrate to new secure hash
        const newPasswordHash = await hashPassword(password);
        user.passwordHash = newPasswordHash;
        await c.env.BRAINSAIT_KV.put(`user:${email}`, JSON.stringify(user));
        await c.env.BRAINSAIT_KV.put(`user:id:${user.id}`, JSON.stringify(user));
      }
    } else {
      // New secure format
      isValidPassword = await verifyPassword(password, user.passwordHash);
    }

    if (!isValidPassword) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts for 15 minutes
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const logger = createLogger(c.req.raw, c.env);
        logger.security('account_locked_excessive_attempts', 'high', user.id, undefined, {
          email: user.email,
          ip: c.req.header('CF-Connecting-IP'),
          attempts: user.loginAttempts
        });
      }
      
      await c.env.BRAINSAIT_KV.put(`user:${email}`, JSON.stringify(user));
      await c.env.BRAINSAIT_KV.put(`user:id:${user.id}`, JSON.stringify(user));
      
      const logger = createLogger(c.req.raw, c.env);
      logger.security('failed_login_attempt', 'medium', user.id, undefined, {
        email: user.email,
        ip: c.req.header('CF-Connecting-IP'),
        attempts: user.loginAttempts
      });
      
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockedUntil = null;

    // Update last login
    user.lastLogin = new Date().toISOString();
    await c.env.BRAINSAIT_KV.put(`user:${email}`, JSON.stringify(user));

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    const { passwordHash: _, ...userResponse } = user;
    return c.json({
      access_token: token,
      token_type: 'bearer',
      user: userResponse
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.auth('login_failed', undefined, false);
    logger.error('User login failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'user_login'
    });
    return c.json({ 
      error: 'Internal server error'
    }, 500);
  }
});

// Get user profile
authRoutes.get('/profile', async (c) => {
  let payload: any = null;
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    payload = await verifyJWT(token, c.env.JWT_SECRET || 'default-secret-for-dev');
    
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Get user from KV store
    const userStr = await c.env.BRAINSAIT_KV.get(`user:id:${payload.userId}`);
    if (!userStr) {
      return c.json({ error: 'User not found' }, 404);
    }

    const user = JSON.parse(userStr);
    const { passwordHash: _, ...userResponse } = user;
    
    return c.json({ user: userResponse });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to get user profile', error instanceof Error ? error : new Error(String(error)), {
      operation: 'get_profile',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Internal server error'
    }, 500);
  }
});

// Update user profile
authRoutes.put('/profile', async (c) => {
  let payload: any = null;
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    payload = await verifyJWT(token, c.env.JWT_SECRET || 'default-secret-for-dev');
    
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const body = await c.req.json();
    
    // Validate input using schema
    const validation = validateSchema(body, profileUpdateSchema);
    if (!validation.isValid) {
      return c.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, 400);
    }

    // Get current user
    const userStr = await c.env.BRAINSAIT_KV.get(`user:id:${payload.userId}`);
    if (!userStr) {
      return c.json({ error: 'User not found' }, 404);
    }

    const user = JSON.parse(userStr);
    
    // Update user data with validated and sanitized input
    const { firstName, lastName, phone } = validation.sanitizedData;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    user.updatedAt = new Date().toISOString();

    // Save updated user
    await c.env.BRAINSAIT_KV.put(`user:${user.email}`, JSON.stringify(user));
    await c.env.BRAINSAIT_KV.put(`user:id:${user.id}`, JSON.stringify(user));

    const { passwordHash: _, ...userResponse } = user;
    return c.json({ user: userResponse });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.error('Failed to update user profile', error instanceof Error ? error : new Error(String(error)), {
      operation: 'update_profile',
      userId: payload?.userId
    });
    return c.json({ 
      error: 'Internal server error'
    }, 500);
  }
});

// Logout (invalidate token - in a real implementation, you'd maintain a blacklist)
authRoutes.post('/logout', async (c) => {
  return c.json({ message: 'Logged out successfully' });
});

// OAuth helper function to create or get user
async function createOrGetOAuthUser(
  email: string, 
  firstName: string, 
  lastName: string, 
  provider: string, 
  providerId: string,
  env: Env
) {
  // Check if user exists
  let userStr = await env.BRAINSAIT_KV.get(`user:${email}`);
  let user;

  if (userStr) {
    user = JSON.parse(userStr);
    // Update OAuth info if not present
    if (!user.oauthProviders) {
      user.oauthProviders = {};
    }
    user.oauthProviders[provider] = providerId;
    user.lastLogin = new Date().toISOString();
  } else {
    // Create new user
    user = {
      id: crypto.randomUUID(),
      email,
      firstName,
      lastName,
      role: 'user',
      isVerified: true, // OAuth users are considered verified
      oauthProviders: {
        [provider]: providerId
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
  }

  // Save user
  await env.BRAINSAIT_KV.put(`user:${email}`, JSON.stringify(user));
  await env.BRAINSAIT_KV.put(`user:id:${user.id}`, JSON.stringify(user));

  return user;
}

// Google OAuth endpoint
authRoutes.post('/oauth/google', async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Authorization code is required' }, 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: c.env.GOOGLE_CLIENT_ID || '',
        client_secret: c.env.GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: c.env.OAUTH_REDIRECT_URL || 'https://care.brainsait.io/auth/callback',
      }),
    });

    if (!tokenResponse.ok) {
      const logger = createLogger(c.req.raw, c.env);
      const errorText = await tokenResponse.text();
      logger.security('google_oauth_token_exchange_failed', 'medium', undefined, undefined, {
        statusCode: tokenResponse.status,
        error: errorText
      });
      return c.json({ error: 'Failed to exchange authorization code' }, 400);
    }

    const tokenData = await tokenResponse.json() as any;

    // Get user info from Google
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!googleUserResponse.ok) {
      return c.json({ error: 'Failed to get user information' }, 400);
    }

    const googleUser = await googleUserResponse.json() as any;

    // Create or get user
    const user = await createOrGetOAuthUser(
      googleUser.email,
      googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
      googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
      'google',
      googleUser.id,
      c.env
    );

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    const { passwordHash, oauthProviders, ...userResult } = user;
    return c.json({
      access_token: token,
      token_type: 'bearer',
      user: userResult
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.auth('google_oauth_failed', undefined, false);
    logger.error('Google OAuth authentication failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'google_oauth'
    });
    return c.json({ 
      error: 'Google authentication failed',
      
    }, 500);
  }
});

// Microsoft OAuth endpoint
authRoutes.post('/oauth/microsoft', async (c) => {
  try {
    const body = await c.req.json();
    const { accessToken, account } = body;

    if (!accessToken || !account) {
      return c.json({ error: 'Access token and account information are required' }, 400);
    }

    // Get user info from Microsoft Graph
    const msUserResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!msUserResponse.ok) {
      return c.json({ error: 'Failed to get user information from Microsoft' }, 400);
    }

    const microsoftUser = await msUserResponse.json() as any;

    // Create or get user
    const user = await createOrGetOAuthUser(
      microsoftUser.mail || microsoftUser.userPrincipalName,
      microsoftUser.givenName || 'User',
      microsoftUser.surname || '',
      'microsoft',
      microsoftUser.id,
      c.env
    );

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    const { passwordHash, oauthProviders, ...userResult } = user;
    return c.json({
      access_token: token,
      token_type: 'bearer',
      user: userResult
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.auth('microsoft_oauth_failed', undefined, false);
    logger.error('Microsoft OAuth authentication failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'microsoft_oauth'
    });
    return c.json({ 
      error: 'Microsoft authentication failed',
      
    }, 500);
  }
});

// GitHub OAuth endpoint
authRoutes.post('/oauth/github', async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Authorization code is required' }, 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID || '',
        client_secret: c.env.GITHUB_CLIENT_SECRET || '',
        code,
      }),
    });

    if (!tokenResponse.ok) {
      return c.json({ error: 'Failed to exchange authorization code' }, 400);
    }

    const tokenData = await tokenResponse.json() as any;

    if (tokenData.error) {
      return c.json({ error: tokenData.error_description || 'GitHub authentication failed' }, 400);
    }

    // Get user info from GitHub
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'BrainSAIT-App',
      },
    });

    if (!githubUserResponse.ok) {
      return c.json({ error: 'Failed to get user information' }, 400);
    }

    const githubUser = await githubUserResponse.json() as any;

    // Get user email (might be private)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'BrainSAIT-App',
      },
    });

    let email = githubUser.email;
    if (!email && emailResponse.ok) {
      const emails = await emailResponse.json() as any[];
      const primaryEmail = emails.find((e: any) => e.primary);
      email = primaryEmail ? primaryEmail.email : emails[0]?.email;
    }

    if (!email) {
      return c.json({ error: 'Unable to get email address from GitHub' }, 400);
    }

    // Create or get user
    const user = await createOrGetOAuthUser(
      email,
      githubUser.name?.split(' ')[0] || githubUser.login || 'User',
      githubUser.name?.split(' ').slice(1).join(' ') || '',
      'github',
      githubUser.id.toString(),
      c.env
    );

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    const { passwordHash, oauthProviders, ...userResult } = user;
    return c.json({
      access_token: token,
      token_type: 'bearer',
      user: userResult
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.auth('github_oauth_failed', undefined, false);
    logger.error('GitHub OAuth authentication failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'github_oauth'
    });
    return c.json({ 
      error: 'GitHub authentication failed',
      
    }, 500);
  }
});

// LinkedIn OAuth endpoint
authRoutes.post('/oauth/linkedin', async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Authorization code is required' }, 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: c.env.LINKEDIN_CLIENT_ID || '',
        client_secret: c.env.LINKEDIN_CLIENT_SECRET || '',
        redirect_uri: c.env.OAUTH_REDIRECT_URL || 'https://care.brainsait.io/auth/callback',
      }),
    });

    if (!tokenResponse.ok) {
      return c.json({ error: 'Failed to exchange authorization code' }, 400);
    }

    const tokenData = await tokenResponse.json() as any;

    // Get user info from LinkedIn using the new API endpoints
    const [profileResponse, emailResponse] = await Promise.all([
      fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }),
      fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      })
    ]);

    if (!profileResponse.ok) {
      return c.json({ error: 'Failed to get user profile information' }, 400);
    }

    const linkedinUser = await profileResponse.json() as any;
    let email = linkedinUser.email;

    // If email is not in the userinfo, try the email endpoint
    if (!email && emailResponse.ok) {
      const emailData = await emailResponse.json() as any;
      if (emailData.elements && emailData.elements.length > 0) {
        email = emailData.elements[0]['handle~']?.emailAddress;
      }
    }

    if (!email) {
      return c.json({ error: 'Unable to get email address from LinkedIn' }, 400);
    }

    // Create or get user
    const user = await createOrGetOAuthUser(
      email,
      linkedinUser.given_name || linkedinUser.name?.split(' ')[0] || 'User',
      linkedinUser.family_name || linkedinUser.name?.split(' ').slice(1).join(' ') || '',
      'linkedin',
      linkedinUser.sub || linkedinUser.id,
      c.env
    );

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    const { passwordHash, oauthProviders, ...userResult } = user;
    return c.json({
      access_token: token,
      token_type: 'bearer',
      user: userResult
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.auth('linkedin_oauth_failed', undefined, false);
    logger.error('LinkedIn OAuth authentication failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'linkedin_oauth'
    });
    return c.json({ 
      error: 'LinkedIn authentication failed',
      
    }, 500);
  }
});

// Gravatar OAuth endpoint
authRoutes.post('/oauth/gravatar', async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code) {
      return c.json({ error: 'Authorization code is required' }, 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://public-api.wordpress.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: c.env.GRAVATAR_CLIENT_ID || '',
        client_secret: c.env.GRAVATAR_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: c.env.OAUTH_REDIRECT_URL || 'https://care.brainsait.io/auth/callback',
      }),
    });

    if (!tokenResponse.ok) {
      const logger = createLogger(c.req.raw, c.env);
      const errorText = await tokenResponse.text();
      logger.security('gravatar_oauth_token_exchange_failed', 'medium', undefined, undefined, {
        statusCode: tokenResponse.status,
        error: errorText
      });
      return c.json({ error: 'Failed to exchange authorization code' }, 400);
    }

    const tokenData = await tokenResponse.json() as any;

    // Get user info from WordPress.com API (Gravatar uses WordPress.com OAuth)
    const gravatarUserResponse = await fetch('https://public-api.wordpress.com/rest/v1/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!gravatarUserResponse.ok) {
      return c.json({ error: 'Failed to get user information' }, 400);
    }

    const gravatarUser = await gravatarUserResponse.json() as any;

    // Create or get user
    const user = await createOrGetOAuthUser(
      gravatarUser.email,
      gravatarUser.display_name?.split(' ')[0] || gravatarUser.username || 'User',
      gravatarUser.display_name?.split(' ').slice(1).join(' ') || '',
      'gravatar',
      gravatarUser.ID.toString(),
      c.env
    );

    // Generate JWT token
    const token = await generateJWT(
      { userId: user.id, email: user.email, role: user.role },
      c.env.JWT_SECRET || 'default-secret-for-dev'
    );

    const { passwordHash, oauthProviders, ...userResult } = user;
    return c.json({
      access_token: token,
      token_type: 'bearer',
      user: userResult
    });

  } catch (error) {
    const logger = createLogger(c.req.raw, c.env);
    logger.auth('gravatar_oauth_failed', undefined, false);
    logger.error('Gravatar OAuth authentication failed', error instanceof Error ? error : new Error(String(error)), {
      operation: 'gravatar_oauth'
    });
    return c.json({ 
      error: 'Gravatar authentication failed',
      
    }, 500);
  }
});

// OAuth callback endpoint (for handling redirects)
authRoutes.get('/callback', async (c) => {
  // This endpoint handles OAuth redirects
  // In most cases, the frontend JavaScript will handle the callback
  // But we provide this endpoint for cases where server-side handling is needed
  
  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Callback</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            margin: 0;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            max-width: 400px;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>❌ OAuth Error</h2>
          <p>Authentication failed: ${error}</p>
          <p><small>This window will close automatically.</small></p>
        </div>
        <script>
          console.log('OAuth error:', '${error}');
          
          let messageSent = false;
          
          function sendErrorMessage() {
            if (messageSent) return;
            
            try {
              if (window.opener && !window.opener.closed) {
                console.log('Sending error message to parent window');
                window.opener.postMessage({ error: '${error}' }, '*');
                messageSent = true;
                
                setTimeout(() => {
                  window.close();
                }, 2000);
              } else {
                setTimeout(sendErrorMessage, 500);
              }
            } catch (err) {
              console.error('Error sending message:', err);
              setTimeout(sendErrorMessage, 500);
            }
          }
          
          setTimeout(sendErrorMessage, 1000);
          
          // Backup close after 10 seconds
          setTimeout(() => {
            window.close();
          }, 10000);
        </script>
      </body>
      </html>
    `);
  }

  if (code && state) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Callback</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            max-width: 400px;
            margin: 0 auto;
          }
          .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>✅ Authentication Successful</h2>
          <div class="spinner"></div>
          <p>Please wait while we redirect you back to the application...</p>
          <p><small>This window will close automatically.</small></p>
        </div>
        <script>
          console.log('OAuth callback received:', { code: '${code}', state: '${state}' });
          
          let messageSent = false;
          let attempts = 0;
          const maxAttempts = 10;
          
          function sendMessage() {
            attempts++;
            console.log(\`Attempt \${attempts} to send message to parent window\`);
            
            if (messageSent) {
              console.log('Message already sent successfully');
              return;
            }
            
            if (attempts > maxAttempts) {
              console.log('Max attempts reached, giving up');
              window.close();
              return;
            }
            
            try {
              if (window.opener && !window.opener.closed) {
                console.log('Sending message to parent window');
                window.opener.postMessage({ 
                  code: '${code}', 
                  state: '${state}',
                  success: true 
                }, '*');
                
                messageSent = true;
                console.log('Message sent successfully');
                
                // Wait a bit before closing to ensure message is received
                setTimeout(() => {
                  console.log('Closing popup window');
                  window.close();
                }, 2000);
                
              } else {
                console.log('No opener window found or window is closed');
                setTimeout(sendMessage, 500);
              }
            } catch (error) {
              console.error('Error sending message:', error);
              setTimeout(sendMessage, 500);
            }
          }
          
          // Wait for the parent window to be ready, then start sending messages
          setTimeout(sendMessage, 1000);
          
          // Backup: close window after 30 seconds if still open
          setTimeout(() => {
            if (!messageSent) {
              console.log('Backup timeout reached, closing window');
              window.close();
            }
          }, 30000);
        </script>
      </body>
      </html>
    `);
  }

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Callback</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          color: #333;
          margin: 0;
        }
        .container {
          background: rgba(255, 255, 255, 0.9);
          padding: 2rem;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          max-width: 400px;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>⚠️ OAuth Error</h2>
        <p>Invalid callback parameters</p>
        <p><small>This window will close automatically.</small></p>
      </div>
      <script>
        console.log('OAuth callback - invalid parameters');
        
        function sendErrorMessage() {
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ error: 'Invalid callback parameters' }, '*');
              
              setTimeout(() => {
                window.close();
              }, 2000);
            } else {
              setTimeout(sendErrorMessage, 500);
            }
          } catch (error) {
            console.error('Error sending message:', error);
            setTimeout(() => window.close(), 2000);
          }
        }
        
        setTimeout(sendErrorMessage, 1000);
        
        // Backup close after 10 seconds
        setTimeout(() => {
          window.close();
        }, 10000);
      </script>
    </body>
    </html>
  `);
});

// Add catch-all handler for non-existent auth endpoints
authRoutes.all('*', async (c) => {
  const logger = createLogger(c.req.raw, c.env);
  logger.security('auth_endpoint_not_found', 'low', undefined, undefined, {
    path: c.req.path,
    method: c.req.method
  });
  return c.json({ error: 'Endpoint not found' }, 404);
});
