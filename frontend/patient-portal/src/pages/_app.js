import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Inter, Montserrat } from 'next/font/google';
import Head from 'next/head';
import '../styles/globals.css';

// Import fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1788ff',
    },
    secondary: {
      main: '#38e3b5',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter)',
    h1: {
      fontFamily: 'var(--font-montserrat)',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'var(--font-montserrat)',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'var(--font-montserrat)',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'var(--font-montserrat)',
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>HealthLinc Patient Portal</title>
      </Head>
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
          --font-montserrat: ${montserrat.style.fontFamily};
        }
      `}</style>
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={`${inter.variable} ${montserrat.variable} font-sans`}>
              <Component {...pageProps} />
            </div>
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </>
  );
}
