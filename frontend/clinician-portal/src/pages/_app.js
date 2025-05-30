import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../styles/globals.css';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066ff',
      light: '#3385ff',
      dark: '#0052cc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00c3af',
      light: '#33cfbf',
      dark: '#009c8c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
      },
    },
  },
});

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const [queryClient] = useState(() => new QueryClient());
  
  // Check if this component needs the layout
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {getLayout(<Component {...pageProps} />)}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                iconTheme: {
                  primary: '#00c3af',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#e11d48',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default MyApp;
