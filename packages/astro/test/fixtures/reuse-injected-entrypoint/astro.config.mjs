import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
		{
			name: 'astropi',
			hooks: {
				'astro:config:setup': async ({ injectRoute }) => {
					injectRoute({
						pattern: `/injected-a`,
						entrypoint: './src/to-inject.astro',
					});
					injectRoute({
						pattern: `/injected-b`,
						entrypoint: './src/to-inject.astro',
					});
					injectRoute({
						pattern: `/dynamic-a/[id]`,
						entrypoint: './src/[id].astro',
					});
					injectRoute({
						pattern: `/dynamic-b/[id]`,
						entrypoint: './src/[id].astro',
					});
				},
			},
		},
	],
});
