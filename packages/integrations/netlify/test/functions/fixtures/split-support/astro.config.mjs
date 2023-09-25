import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    dist: new URL('./fixtures/split-support/dist/', import.meta.url),
    functionPerRoute: true,
  }),
  site: `http://example.com`,
});
