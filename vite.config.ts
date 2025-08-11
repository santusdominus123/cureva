import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['https://lcdtn4rd-5173.asse.devtunnels.ms/'], // ganti dengan string ngrok Anda
  },
});