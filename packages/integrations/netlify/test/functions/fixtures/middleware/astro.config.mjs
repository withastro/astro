import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    edgeMiddleware: process.env.EDGE_MIDDLEWARE === 'true',
    imageCDN: process.env.DISABLE_IMAGE_CDN ? false : undefined,
  }),
  site: `http://example.com`,
});