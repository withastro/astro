import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
	integrations: [svelte()],
	vite: {
		resolve: {
			alias: [
				{ find:/^component:(.*)$/, replacement: '/src/components/$1' }
			]
		}
	}
});
