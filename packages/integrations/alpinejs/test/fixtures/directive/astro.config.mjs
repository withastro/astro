import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';

export default defineConfig({
  integrations: [alpine({
    entrypoint: "./src/entrypoint.ts"
  })],
})
