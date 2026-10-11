import { getContainerRenderer } from '@astrojs/react/container-renderer';
import astro from '@astrojs/vite-plugin-astro';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		astro({ renderers: [getContainerRenderer()] }),
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
