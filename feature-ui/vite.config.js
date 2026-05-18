import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/events': 'http://localhost:3847',
      '/state': 'http://localhost:3847',
      '/active-sticky': 'http://localhost:3847',
    }
  }
})
