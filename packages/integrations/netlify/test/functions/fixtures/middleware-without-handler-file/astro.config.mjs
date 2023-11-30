import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeMiddleware: true,
  }),
  site: `http://example.com`,
});