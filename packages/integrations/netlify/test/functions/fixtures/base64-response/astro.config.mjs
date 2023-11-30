import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    binaryMediaTypes: ['font/otf'],
  }),
  site: `http://example.com`,
});