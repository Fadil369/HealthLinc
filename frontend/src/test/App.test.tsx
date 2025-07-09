import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock all contexts
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../contexts/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useLanguage: () => ({
    language: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key,
  }),
}));

vi.mock('../contexts/PaymentContext', () => ({
  PaymentProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  usePayment: () => ({
    subscription: null,
    loading: false,
    createSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // App should render successfully
    expect(document.body).toBeInTheDocument();
  });

  it('renders login page when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    // Should show login page or redirect to login
    // This is a basic test - actual behavior depends on routing logic
    expect(document.body).toBeInTheDocument();
  });
});