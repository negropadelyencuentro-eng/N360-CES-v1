import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/wger': {
        target: 'https://wger.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wger/, ''),
      },
    },
  },
})
