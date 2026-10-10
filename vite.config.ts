import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the site from /thenewjournal/; local dev stays at /.
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
