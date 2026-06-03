import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function loadFrontendEnv() {
  const envPath = path.resolve(__dirname, '.env')
  const env: Record<string, string> = {}

  if (!fs.existsSync(envPath)) {
    return env
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2')
  }

  return env
}

const frontendEnv = loadFrontendEnv()

function envWarningPlugin(requiredVars: string[], env: Record<string, string>): Plugin {
  return {
    name: 'env-warning',
    buildStart() {
      for (const varName of requiredVars) {
        if (!env[varName]) {
          console.warn(`[env-warning] Missing env variable: ${varName}`)
        }
      }
    },
  }
}

export default defineConfig({
  envDir: false,
  plugins: [
    react(),
    tailwindcss(),
    envWarningPlugin(['VITE_API_URL', 'VITE_GOOGLE_CLIENT_ID'], frontendEnv),
  ],
  define: Object.fromEntries(
    Object.entries(frontendEnv)
      .filter(([key]) => key.startsWith('VITE_'))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  ),
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
