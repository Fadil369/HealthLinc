import { PublicClientApplication, AuthenticationResult } from '@azure/msal-browser';

// OAuth Provider Configuration
export const oauthConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    scope: 'openid email profile',
    authUrl: 'https://accounts.google.com/oauth/authorize',
  },
  microsoft: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/common',
    scopes: ['openid', 'profile', 'email'],
  },
  github: {
    clientId: 'Ov23liqV068KCxscpq7l',
    scope: 'read:user user:email',
    authUrl: 'https://github.com/login/oauth/authorize',
  },
  linkedin: {
    clientId: '78nrbipf31tm67',
    scope: 'openid profile email',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  },
  gravatar: {
    clientId: '103135',
    scope: 'global',
    authUrl: 'https://public-api.wordpress.com/oauth2/authorize',
  },
};

// Microsoft MSAL Configuration
export const msalConfig = {
  auth: {
    clientId: oauthConfig.microsoft.clientId,
    authority: oauthConfig.microsoft.authority,
    redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URL || 'http://localhost:5174/auth/callback',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// OAuth Provider URLs
export const getOAuthUrl = (provider: 'google' | 'github' | 'linkedin' | 'gravatar') => {
  const config = oauthConfig[provider];
  const redirectUri = encodeURIComponent(import.meta.env.VITE_OAUTH_REDIRECT_URL || 'https://care.brainsait.io/auth/callback');
  
  switch (provider) {
    case 'google':
      return `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${provider}`;
    
    case 'github':
      return `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(config.scope)}&state=${provider}`;
    
    case 'linkedin':
      return `${config.authUrl}?response_type=code&client_id=${config.clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(config.scope)}&state=${provider}`;
    
    case 'gravatar':
      return `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${provider}`;
    
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
};

// OAuth Popup Handler
export const openOAuthPopup = (provider: 'google' | 'github' | 'linkedin' | 'gravatar'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const url = getOAuthUrl(provider);
    console.log(`Opening OAuth popup for ${provider}:`, url);
    
    const popup = window.open(
      url,
      `${provider}-oauth`,
      'width=600,height=700,scrollbars=yes,resizable=yes,top=100,left=' + (screen.width / 2 - 300)
    );

    if (!popup) {
      reject(new Error('Failed to open popup. Please allow popups for this site.'));
      return;
    }

    let messageReceived = false;
    let resolved = false;

    const cleanup = () => {
      window.removeEventListener('message', messageHandler);
      clearInterval(pollTimer);
      clearTimeout(timeoutId);
    };

    // Listen for messages from the popup
    const messageHandler = (event: MessageEvent) => {
      console.log(`[${provider}] Received message from popup:`, event.data, 'Origin:', event.origin);
      
      // Only accept messages from our domain
      const allowedOrigins = [
        window.location.origin,
        'https://care.brainsait.io',
        'http://localhost:5174'
      ];
      
      if (!allowedOrigins.some(origin => event.origin === origin || event.origin.includes('care.brainsait.io'))) {
        console.log(`[${provider}] Ignoring message from foreign origin:`, event.origin);
        return;
      }

      if (resolved) {
        console.log(`[${provider}] Promise already resolved, ignoring message`);
        return;
      }

      if (event.data.error) {
        resolved = true;
        messageReceived = true;
        cleanup();
        
        // Give popup time to close naturally
        setTimeout(() => {
          if (!popup.closed) popup.close();
        }, 500);
        
        reject(new Error(event.data.error));
        return;
      }

      if (event.data.code && event.data.state === provider) {
        resolved = true;
        messageReceived = true;
        console.log(`[${provider}] OAuth success, got code:`, event.data.code);
        cleanup();
        
        // Give popup time to close naturally
        setTimeout(() => {
          if (!popup.closed) popup.close();
        }, 500);
        
        resolve(event.data.code);
        return;
      }

      console.log(`[${provider}] Message received but not matching expected format`);
    };

    window.addEventListener('message', messageHandler);

    // Focus the popup
    if (popup.focus) {
      popup.focus();
    }

    // Poll for popup closure with less frequent checks
    const pollTimer = setInterval(() => {
      try {
        if (popup.closed) {
          if (!messageReceived && !resolved) {
            console.log(`[${provider}] OAuth popup was closed without receiving a message`);
            resolved = true;
            cleanup();
            reject(new Error(`${provider} OAuth popup was closed before authentication completed`));
          }
          return;
        }
      } catch (error) {
        // Popup might be in a different domain, can't access .closed property
        console.log(`[${provider}] Cannot check popup status (cross-origin):`, error);
      }
    }, 2000);

    // Timeout after 5 minutes
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        console.log(`[${provider}] OAuth popup timeout`);
        resolved = true;
        cleanup();
        
        try {
          if (!popup.closed) {
            popup.close();
          }
        } catch (error) {
          console.log(`[${provider}] Could not close popup:`, error);
        }
        
        reject(new Error(`${provider} OAuth popup timeout (5 minutes)`));
      }
    }, 300000);

    // Log popup state for debugging
    console.log(`[${provider}] Popup opened:`, {
      popup: popup,
      closed: popup.closed,
      location: popup.location
    });
  });
};

// Microsoft OAuth Handler
export const handleMicrosoftOAuth = async (): Promise<AuthenticationResult> => {
  try {
    const loginResponse = await msalInstance.loginPopup({
      scopes: oauthConfig.microsoft.scopes,
      prompt: 'select_account',
    });
    
    return loginResponse;
  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    throw error;
  }
};
