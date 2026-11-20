import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      // Dua halaman: dashboard (/) dan formulir uji pengguna (/uji/).
      input: { main: resolve(import.meta.dirname, 'index.html'), uji: resolve(import.meta.dirname, 'uji/index.html') },
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
            { name: 'visualization', test: /node_modules[\\/](recharts|d3-|@reduxjs|redux|react-redux|immer|reselect|victory-vendor)/, priority: 10 },
          ],
        },
      },
    },
  },
})
