import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'src/app/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
    },
  },
});
