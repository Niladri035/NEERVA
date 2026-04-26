import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://neerva.onrender.com',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://neerva.onrender.com',
        ws: true,
      },
    },
  },
})
