import { defineConfig } from 'astro/config';
import { VitePWA } from 'vite-plugin-pwa';

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [VitePWA()],
	},
});
