import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import nodejs from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	adapter: nodejs(),
	integrations: [svelte()],
});
