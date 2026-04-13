import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_API || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
