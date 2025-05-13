import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
// import testAdapter from '../../../test-adapter.js';
export default defineConfig({
  output: 'static',
	// adapter: testAdapter(),
  integrations: [
    svelte()
  ],
});
