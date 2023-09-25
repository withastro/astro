import { defineConfig } from 'astro/config';
import netlifyAdapter from '../../../../dist/index.js';


export default defineConfig({
  output: process.env.ASTRO_OUTPUT || 'server',
  adapter: netlifyAdapter({
    dist: new URL('./dist/', import.meta.url),
  }),
  site: `http://example.com`,
});