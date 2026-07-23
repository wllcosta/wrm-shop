import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Em desenvolvimento local, redireciona /api pro backend Express (porta 3001).
      // Em produção (Vercel), /api já cai direto na função serverless, então
      // esse proxy não é usado.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
