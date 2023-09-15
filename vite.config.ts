import path from 'path';
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8000,
  },
  plugins: [svelte({})],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
