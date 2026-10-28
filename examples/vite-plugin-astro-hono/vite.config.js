import react from '@astrojs/react/renderer';
import astro from '@astrojs/vite-plugin-astro';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Only the Astro component language: no pages, no routing. Hono routes the requests and renders
// Astro components with `renderToResponse()` from `@astrojs/runtime`.
export default defineConfig({
	plugins: [astro({ renderers: [react()] }), viteReact()],
	environments: {
		ssr: {
			build: { outDir: 'dist/server', rolldownOptions: { input: { app: 'src/app.ts' } } },
		},
		client: { build: { outDir: 'dist/client' } },
	},
});
