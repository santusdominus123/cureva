import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ],
  server: {
    allowedHosts: ['https://lcdtn4rd-5.asse.devtunnels.ms/'], // ganti dengan string ngrok Anda
  },
  optimizeDeps: {
    exclude: ['@mkkellogg/gaussian-splats-3d'] // Exclude from pre-bundling for better compatibility
  },
  build: {
    target: 'esnext', // Modern target for SharedArrayBuffer support
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
});