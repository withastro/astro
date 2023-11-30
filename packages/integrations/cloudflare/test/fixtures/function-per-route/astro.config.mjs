import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

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
