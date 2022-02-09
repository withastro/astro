// @ts-check

export default /** @type {import('astro').AstroUserConfig} */ ({
	renderers: ['@astrojs/renderer-svelte'],
	vite: {
		server: {
			proxy: {
				'/api': 'http://localhost:8085'
			}
		}
	}
});
