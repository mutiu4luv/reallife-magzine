import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ["**/dist/**", "**/test-results/**", "**/playwright-report/**", "**/e2e-*.spec.js"],
    },
  },
})
