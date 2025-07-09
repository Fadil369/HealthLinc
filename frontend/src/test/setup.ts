import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;
window.IntersectionObserverEntry = vi.fn();

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock window.location
delete (window as any).location;
window.location = {
  href: 'http://localhost:5174',
  origin: 'http://localhost:5174',
  protocol: 'http:',
  hostname: 'localhost',
  port: '5174',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
} as any;

// Mock crypto for JWT
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn(() => new Uint8Array(32)),
    subtle: {
      importKey: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
    },
  },
});

// Mock canvas for Chart.js
HTMLCanvasElement.prototype.getContext = vi.fn();
HTMLCanvasElement.prototype.toBlob = vi.fn();

// Mock audio for notifications
window.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  load: vi.fn(),
}));

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(),
      getElement: vi.fn(),
    })),
    confirmCardPayment: vi.fn(),
    createPaymentMethod: vi.fn(),
  })),
}));

// Mock Azure MSAL
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn(() => ({
    initialize: vi.fn(),
    loginPopup: vi.fn(),
    logout: vi.fn(),
    acquireTokenSilent: vi.fn(),
    getAllAccounts: vi.fn(() => []),
  })),
  EventType: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    LOGOUT_SUCCESS: 'logout_success',
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({}),
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    form: 'form',
    section: 'section',
    article: 'article',
    header: 'header',
    main: 'main',
    aside: 'aside',
    footer: 'footer',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    p: 'p',
    span: 'span',
    a: 'a',
    img: 'img',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  LineElement: vi.fn(),
  PointElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(() => ({ type: 'div', props: { 'data-testid': 'bar-chart', children: 'Bar Chart' } })),
  Line: vi.fn(() => ({ type: 'div', props: { 'data-testid': 'line-chart', children: 'Line Chart' } })),
  Doughnut: vi.fn(() => ({ type: 'div', props: { 'data-testid': 'doughnut-chart', children: 'Doughnut Chart' } })),
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  ToastContainer: vi.fn(() => ({ type: 'div', props: { 'data-testid': 'toast-container', children: 'Toast Container' } })),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const mockIcon = ({ size = 24, color = 'currentColor', ...props }: any) => ({
    type: 'svg',
    props: {
      width: size,
      height: size,
      fill: color,
      ...props,
      'data-testid': 'lucide-icon',
      children: { type: 'rect', props: { width: size, height: size } }
    }
  });
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return mockIcon;
      }
      return undefined;
    },
  });
});

// Mock @heroicons/react
vi.mock('@heroicons/react/24/outline', () => {
  const mockIcon = ({ className, ...props }: any) => ({
    type: 'svg',
    props: {
      className,
      ...props,
      'data-testid': 'heroicon',
      children: { type: 'rect', props: { width: '24', height: '24' } }
    }
  });
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return mockIcon;
      }
      return undefined;
    },
  });
});

vi.mock('@heroicons/react/24/solid', () => {
  const mockIcon = ({ className, ...props }: any) => ({
    type: 'svg',
    props: {
      className,
      ...props,
      'data-testid': 'heroicon-solid',
      children: { type: 'rect', props: { width: '24', height: '24' } }
    }
  });
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return mockIcon;
      }
      return undefined;
    },
  });
});