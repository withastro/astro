import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'hybrid',
  adapter: netlify(),
  site: `http://example.com`,
  redirects: {
    '/other': '/',
  },
});