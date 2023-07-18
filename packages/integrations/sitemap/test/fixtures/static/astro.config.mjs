import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [sitemap()],
	site: 'http://example.com',
  redirects: {
    '/redirect': '/'
  },
  experimental: {
    redirects: true
  }
})
