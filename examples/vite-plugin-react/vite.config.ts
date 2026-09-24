import react from '@astrojs/react/vite';
import { astro } from 'astro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [astro({ renderers: [react()] })],
});
