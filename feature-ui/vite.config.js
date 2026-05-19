import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/events': 'http://localhost:3847',
      '/state': 'http://localhost:3847',
      '/active-sticky': 'http://localhost:3847',
    }
  }
})
