import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'hybrid',
  integrations: [
    svelte()
  ],
  experimental: {
    serverIslands: true,
  }
});

