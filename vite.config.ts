import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { loadEnv as loadViteEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadViteEnv(mode, '.', '')
  const proxyTarget = env.CODEMATCH_API_PROXY_TARGET ?? 'http://127.0.0.1:8080'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: proxyTarget },
        '/actuator': { target: proxyTarget },
      },
    },
    test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'] },
  }
})
