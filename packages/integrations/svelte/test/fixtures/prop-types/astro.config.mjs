import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  srcDir: './types',
  integrations: [svelte()]
});
