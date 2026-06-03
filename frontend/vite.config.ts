import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function envWarningPlugin(requiredVars: string[]): Plugin {
  return {
    name: 'env-warning',
    buildStart() {
      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          console.warn(`[env-warning] Missing env variable: ${varName}`)
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    envWarningPlugin(['VITE_API_URL', 'VITE_GOOGLE_CLIENT_ID']),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7210',
        changeOrigin: true,
        secure: false,
      },
      '/graphql': {
        target: 'https://localhost:7210',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
