import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // Rutas relativas: el build funciona servido desde cualquier carpeta.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
  },
})
