import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { publishPlugin } from './scripts/publish-plugin.ts'

// Cloudflare Web Analytics: cookieless visitor stats. The token is public by design.
// Added to builds only, so visits during `npm run dev` are never counted.
const CF_ANALYTICS_TOKEN = 'd032870c75c34170aaa0e7263f935d29'

function cloudflareAnalytics(): Plugin {
  return {
    name: 'cloudflare-web-analytics',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'script',
        attrs: {
          type: 'module',
          src: 'https://static.cloudflareinsights.com/beacon.min.js',
          'data-cf-beacon': JSON.stringify({ token: CF_ANALYTICS_TOKEN }),
        },
        injectTo: 'body',
      },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig({
  // The site lives at the root of thenewjournal.org. Set PAGES_BASE (e.g. /thenewjournal/)
  // only to build for a sub-path, such as a GitHub Pages project URL without a custom domain.
  base: process.env.PAGES_BASE ?? '/',
  // publishPlugin applies only to `npm run dev`: builds never contain the publish endpoints.
  plugins: [react(), tailwindcss(), publishPlugin(), cloudflareAnalytics()],
})
