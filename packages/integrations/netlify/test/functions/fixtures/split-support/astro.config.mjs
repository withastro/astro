import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    dist: new URL('./fixtures/split-support/dist/', import.meta.url),
    functionPerRoute: true,
  }),
  site: `http://example.com`,
});
