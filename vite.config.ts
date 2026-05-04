import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 8100,
    strictPort: false,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io',
      'localhost',
      'all' // Permite todos los hosts como fallback
    ]
  }
});
