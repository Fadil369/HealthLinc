import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { openOAuthPopup, handleMicrosoftOAuth } from '../config/oauth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
  role: string;
  isVerified: boolean;
  subscription?: {
    tier: 'basic' | 'pro' | 'premium' | 'enterprise';
    status: 'active' | 'past_due' | 'canceled' | 'incomplete';
    currentPeriodEnd: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  loginWithGravatar: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const logout = React.useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    setUser(null);
    navigate('/login');
    toast.info('Logged out successfully');
  }, [navigate]);

  const fetchUserProfile = React.useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = await response.json();
    setUser(userData);
  }, [API_BASE]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          await fetchUserProfile();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [fetchUserProfile, logout]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      setUser(data.user);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          password: userData.password,
          company_name: userData.companyName,
          role: userData.role || 'user',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      setUser(data.user);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const token = localStorage.getItem('access_token');
    if (!token || !user) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    const updatedUser = await response.json();
    setUser(updatedUser);
    toast.success('Profile updated successfully!');
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to change password');
    }

    toast.success('Password changed successfully!');
  };

  // OAuth Login Methods
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const code = await openOAuthPopup('google');
      
      const response = await fetch(`${API_BASE}/auth/oauth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Google login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setUser(data.user);
      toast.success('Successfully logged in with Google!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      setLoading(true);
      const loginResponse = await handleMicrosoftOAuth();
      
      const response = await fetch(`${API_BASE}/auth/oauth/microsoft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessToken: loginResponse.accessToken,
          account: loginResponse.account 
        }),
      });

      if (!response.ok) {
        throw new Error('Microsoft login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setUser(data.user);
      toast.success('Successfully logged in with Microsoft!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Microsoft login error:', error);
      toast.error('Microsoft login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGitHub = async () => {
    try {
      setLoading(true);
      console.log('Starting GitHub OAuth...');
      
      // Show loading toast
      const loadingToast = toast.loading('Opening GitHub login...');
      
      try {
        const code = await openOAuthPopup('github');
        console.log('Got GitHub OAuth code:', code);
        
        // Update loading message
        toast.update(loadingToast, { 
          render: 'Completing GitHub login...'
        });
        
        const response = await fetch(`${API_BASE}/auth/oauth/github`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        console.log('GitHub OAuth response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('GitHub OAuth error response:', errorData);
          throw new Error(errorData.error || 'GitHub login failed');
        }

        const data = await response.json();
        console.log('GitHub OAuth success, setting token and user');
        
        localStorage.setItem('access_token', data.access_token);
        setUser(data.user);
        
        toast.update(loadingToast, { 
          render: 'Successfully logged in with GitHub!', 
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        
        navigate('/dashboard');
      } catch (popupError) {
        toast.dismiss(loadingToast);
        throw popupError;
      }
    } catch (error) {
      console.error('GitHub login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'GitHub login failed. Please try again.';
      
      if (errorMessage.includes('popup was closed')) {
        toast.error('GitHub login was cancelled. Please try again and complete the authorization.');
      } else if (errorMessage.includes('popup timeout')) {
        toast.error('GitHub login took too long. Please try again.');
      } else if (errorMessage.includes('Failed to open popup')) {
        toast.error('Please allow popups for this site and try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithLinkedIn = async () => {
    try {
      setLoading(true);
      console.log('Starting LinkedIn OAuth...');
      
      // Show loading toast
      const loadingToast = toast.loading('Opening LinkedIn login...');
      
      try {
        const code = await openOAuthPopup('linkedin');
        console.log('Got LinkedIn OAuth code:', code);
        
        // Update loading message
        toast.update(loadingToast, { 
          render: 'Completing LinkedIn login...'
        });
        
        const response = await fetch(`${API_BASE}/auth/oauth/linkedin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        console.log('LinkedIn OAuth response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('LinkedIn OAuth error response:', errorData);
          throw new Error(errorData.error || 'LinkedIn login failed');
        }

        const data = await response.json();
        console.log('LinkedIn OAuth success, setting token and user');
        
        localStorage.setItem('access_token', data.access_token);
        setUser(data.user);
        
        toast.update(loadingToast, { 
          render: 'Successfully logged in with LinkedIn!', 
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        
        navigate('/dashboard');
      } catch (popupError) {
        toast.dismiss(loadingToast);
        throw popupError;
      }
    } catch (error) {
      console.error('LinkedIn login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'LinkedIn login failed. Please try again.';
      
      if (errorMessage.includes('popup was closed')) {
        toast.error('LinkedIn login was cancelled. Please try again and complete the authorization.');
      } else if (errorMessage.includes('popup timeout')) {
        toast.error('LinkedIn login took too long. Please try again.');
      } else if (errorMessage.includes('Failed to open popup')) {
        toast.error('Please allow popups for this site and try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGravatar = async () => {
    try {
      setLoading(true);
      console.log('Starting Gravatar OAuth...');
      
      // Show loading toast
      const loadingToast = toast.loading('Opening Gravatar login...');
      
      try {
        const code = await openOAuthPopup('gravatar');
        console.log('Got Gravatar OAuth code:', code);
        
        // Update loading message
        toast.update(loadingToast, { 
          render: 'Completing Gravatar login...'
        });
        
        const response = await fetch(`${API_BASE}/auth/oauth/gravatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        console.log('Gravatar OAuth response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Gravatar OAuth error response:', errorData);
          throw new Error(errorData.error || 'Gravatar login failed');
        }

        const data = await response.json();
        console.log('Gravatar OAuth success, setting token and user');
        
        localStorage.setItem('access_token', data.access_token);
        setUser(data.user);
        
        toast.update(loadingToast, { 
          render: 'Successfully logged in with Gravatar!', 
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        
        navigate('/dashboard');
      } catch (popupError) {
        toast.dismiss(loadingToast);
        throw popupError;
      }
    } catch (error) {
      console.error('Gravatar login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gravatar login failed. Please try again.';
      
      if (errorMessage.includes('popup was closed')) {
        toast.error('Gravatar login was cancelled. Please try again and complete the authorization.');
      } else if (errorMessage.includes('popup timeout')) {
        toast.error('Gravatar login took too long. Please try again.');
      } else if (errorMessage.includes('Failed to open popup')) {
        toast.error('Please allow popups for this site and try again.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      refreshToken,
      loginWithGoogle,
      loginWithMicrosoft,
      loginWithGitHub,
      loginWithLinkedIn,
      loginWithGravatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
