import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    binaryMediaTypes: ['font/otf'],
  }),
  site: `http://example.com`,
});