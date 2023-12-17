import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeMiddleware: process.env.EDGE_MIDDLEWARE === 'true',
  }),
  site: `http://example.com`,
});