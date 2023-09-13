import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    mode: 'directory', 
    functionPerRoute: true
  }),
  output: 'server',
  vite: {
    build: {
      minify: false,
    },
  },
});
