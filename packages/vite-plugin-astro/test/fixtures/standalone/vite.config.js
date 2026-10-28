import { getContainerRenderer } from '@astrojs/react/container-renderer';
import astro from '@astrojs/vite-plugin-astro';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		astro({
			renderers: [
				{
					...getContainerRenderer(),
					devHeadScript: 'window.__devHead = "__BASE__";',
					// Only the client entrypoint of the renderer imports it, which the optimizer's scan of the
					// project does not reach: discovering it on the first island request reloads the page.
					optimizeDeps: { client: { include: ['react-dom/client'] } },
				},
			],
		}),
		// Without options: `astro()` keeps the JSX refresh filter of `viteReact()` away from `.astro`
		// script modules.
		viteReact(),
		// `@astrojs/react/server.js` reads its options from a virtual module that the `@astrojs/react`
		// integration normally provides.
		{
			name: 'react-opts',
			resolveId(id) {
				if (id === 'astro:react:opts') return '\0astro:react:opts';
			},
			load(id) {
				if (id === '\0astro:react:opts') return 'export default {};';
			},
		},
	],
	ssr: { noExternal: ['@astrojs/react'] },
	environments: {
		ssr: {
			build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
		},
		client: { build: { outDir: 'dist/client' } },
	},
});
