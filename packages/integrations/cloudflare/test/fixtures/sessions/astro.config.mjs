// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  output: 'server',
  site: `http://example.com`,
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
