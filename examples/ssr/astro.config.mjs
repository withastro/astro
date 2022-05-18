import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import layer0 from '@astrojs/layer0';

// https://astro.build/config
export default defineConfig({
	adapter: layer0(),
	integrations: [svelte()],
});
