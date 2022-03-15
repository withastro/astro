import { defineConfig } from 'astro/config';
import { VitePWA } from 'vite-plugin-pwa';

// https://astro.build/config
export default defineConfig({
	renderers: [],
	vite: {
		plugins: [VitePWA()],
	},
});
