import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Enable polling so Vite detects file edits on external exFAT/FAT32 pendrives on macOS
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      // Proxy all /api/* requests to Express backend
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      // Proxy all /uploads/* requests to Express backend (serves static media files)
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
