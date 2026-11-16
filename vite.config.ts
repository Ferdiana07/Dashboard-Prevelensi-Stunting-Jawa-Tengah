import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
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
