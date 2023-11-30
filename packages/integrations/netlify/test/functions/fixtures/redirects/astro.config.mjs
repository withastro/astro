import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'hybrid',
  adapter: netlify(),
  site: `http://example.com`,
  redirects: {
    '/other': '/',
  },
});