import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get environment variables based on mode
  const isProd = mode === 'production';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    build: {
      // Optimize bundle for Cloudflare Workers
      minify: isProd ? 'terser' : false,
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Aggressive code splitting for better caching and performance
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react';
              }
              // Router
              if (id.includes('react-router')) {
                return 'router';
              }
              // UI libraries
              if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('heroicons')) {
                return 'ui';
              }
              // Charts and visualization
              if (id.includes('chart') || id.includes('recharts')) {
                return 'charts';
              }
              // Utilities
              if (id.includes('date-fns') || id.includes('lodash') || id.includes('clsx')) {
                return 'utils';
              }
              // Auth and payment
              if (id.includes('stripe') || id.includes('msal') || id.includes('jwt')) {
                return 'auth';
              }
              // Other vendors
              return 'vendor';
            }
            
            // Feature-based chunking for application code
            if (id.includes('src/pages')) {
              if (id.includes('Dashboard')) return 'dashboard';
              if (id.includes('Patient')) return 'patients';
              if (id.includes('Auth') || id.includes('Login') || id.includes('Register')) return 'auth';
              if (id.includes('Payment') || id.includes('Subscription')) return 'payments';
              if (id.includes('Settings')) return 'settings';
              return 'pages';
            }
            
            if (id.includes('src/components')) {
              return 'components';
            }
            
            if (id.includes('src/contexts') || id.includes('src/hooks')) {
              return 'context';
            }
          },
          // Optimize asset naming
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || 'asset';
            const info = name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
        },
      },
      // Enable tree shaking
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
    },
    // CSS optimization
    css: {
      devSourcemap: !isProd,
    },
    // Tweak dev server for better development experience
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8787', // Wrangler dev default port
          changeOrigin: true,
          secure: false,
        }
      }
    },
    // Handle preview for testing production build locally
    preview: {
      port: 8080,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  };
});
