import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { publishPlugin } from './scripts/publish-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  // The site lives at the root of thenewjournal.org. Set PAGES_BASE (e.g. /thenewjournal/)
  // only to build for a sub-path, such as a GitHub Pages project URL without a custom domain.
  base: process.env.PAGES_BASE ?? '/',
  // publishPlugin applies only to `npm run dev`: builds never contain the publish endpoints.
  plugins: [react(), tailwindcss(), publishPlugin()],
})
