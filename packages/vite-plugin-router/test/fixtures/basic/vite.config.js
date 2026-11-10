import astro from '@astrojs/vite-plugin-astro';
import router from '@astrojs/vite-plugin-router';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [router(), astro()],
});
