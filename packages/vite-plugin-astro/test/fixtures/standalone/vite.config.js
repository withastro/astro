import react from '@astrojs/react/renderer';
import astro from '@astrojs/vite-plugin-astro';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		astro({ renderers: [react()] }),
		// Without options: `astro()` keeps the JSX refresh filter of `viteReact()` away from `.astro`
		// script modules.
		viteReact(),
	],
	environments: {
		ssr: {
			build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
		},
		client: { build: { outDir: 'dist/client' } },
	},
});
