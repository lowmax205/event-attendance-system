import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files for the given mode from the project root
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react(), svgr()],
    envDir: '.',
    // Base path for GitHub Pages or sub-path hosting
    // Use VITE_BASE_PATH (e.g., "/EAS/") or '/' by default
    base: env.VITE_BASE_PATH && env.VITE_BASE_PATH.trim() ? env.VITE_BASE_PATH : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
    },
    build: {
      sourcemap: mode === 'development',
      target: 'es2022',
      modulePreload: true,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor libraries
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-popover',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-separator',
              '@radix-ui/react-progress',
              '@radix-ui/react-avatar',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-visually-hidden',
              '@radix-ui/react-slot',
            ],
            'vendor-utils': [
              'clsx',
              'class-variance-authority',
              'tailwind-merge',
              'date-fns',
              'framer-motion',
              'zod',
            ],
            'vendor-charts': ['recharts'],
            'vendor-icons': ['lucide-react', '@tabler/icons-react'],
            'vendor-maps': ['mapbox-gl'],
            'vendor-misc': [
              'qrcode',
              'react-webcam',
              'react-signature-canvas',
              '@dnd-kit/core',
              '@dnd-kit/sortable',
              '@dnd-kit/utilities',
              '@dnd-kit/modifiers',
              '@tanstack/react-table',
              'react-day-picker',
              'sonner',
              'vaul',
            ],
            // Separate API service to resolve dynamic import warning
            'api-service': ['./src/services/api-service.js'],
          },
        },
      },
    },
    esbuild: { jsx: 'automatic' },
    server: {
      port: 5000,
      open: false,
      host: '0.0.0.0',
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || null,
          changeOrigin: true,
          secure: true,
          followRedirects: true,
        },
      },
    },
  };
});
