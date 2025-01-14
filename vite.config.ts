import path from 'path';
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import basicSSL from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8000,
  },
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
        hmr: !process.env.VITEST,
      }
    }),
    basicSSL({
      domains: ['*.localhost:8000', '*.local.d:8000']
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './tests'),
    },
  },
})
