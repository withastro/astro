// @ts-check

export default defineConfig({
	renderers: ['@astrojs/renderer-svelte'],
	vite: {
		server: {
			proxy: {
				'/api': 'http://localhost:8085',
			},
		},
	},
});
