import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Explicitly ignore database files, uploads, and backend files from Vite's watcher
      // This completely eliminates auto page refreshes caused by MySQL checkpoints and file uploads
      watch: {
        ignored: [
          '**/mysql_data/**',
          '**/storage/**',
          '**/backend/**',
          '**/ml/**',
          '**/*.pt',
          '**/*.py',
          '**/*.log',
          '**/*.db',
          '**/*.sqlite*',
          '**/node_modules/**',
          '**/dist/**',
          '**/.git/**',
        ],
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/storage': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://127.0.0.1:8000',
          ws: true,
        },
      },
    },
  };
});
