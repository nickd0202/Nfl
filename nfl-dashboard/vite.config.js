import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/espn-site': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/espn-site/, '')
      },
      '/espn-core': {
        target: 'https://sports.core.api.espn.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/espn-core/, '')
      }
    }
  }
})