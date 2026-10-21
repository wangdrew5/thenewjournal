import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { publishPlugin } from './scripts/publish-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /thenewjournal/; local dev stays at /.
  base: process.env.PAGES_BASE ?? '/',
  // publishPlugin applies only to `npm run dev`: builds never contain the publish endpoints.
  plugins: [react(), tailwindcss(), publishPlugin()],
})
