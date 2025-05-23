import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import testAdapter from '../../../test-adapter.js';
import mdx from '@astrojs/mdx';

export default defineConfig({
  adapter: testAdapter(),
  output: 'server',
  integrations: [
    svelte(),
    mdx()
  ],
});

