import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: ({ children }: { children: React.ReactNode }) => <div data-testid="route">{children}</div>,
  Navigate: () => <div data-testid="navigate" />,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}))

// Mock react-toastify
vi.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}))

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('router')).toBeInTheDocument()
  })

  it('includes toast container for notifications', () => {
    render(<App />)
    expect(screen.getByTestId('toast-container')).toBeInTheDocument()
  })

  it('sets up routing structure', () => {
    render(<App />)
    expect(screen.getByTestId('routes')).toBeInTheDocument()
  })
})