function getViteConfiguration() {
	return {
		optimizeDeps: {
			include: ['@test/custom-element-renderer/polyfill.js', '@test/custom-element-renderer/hydration-polyfill.js'],
			exclude: ['@test/custom-element-renderer/server.js']
		},
	};
}

export default function () {
	return {
		name: '@test/custom-element-renderer',
		hooks: {
			'astro:config:setup': ({ updateConfig, addRenderer, injectScript }) => {
				// Inject the necessary polyfills on every page
				injectScript('head-inline', `import('@test/custom-element-renderer/polyfill.js');`);
				// Inject the hydration code, before a component is hydrated.
				injectScript('before-hydration', `import('@test/custom-element-renderer/hydration-polyfill.js');`);
				// Add the lit renderer so that Astro can understand lit components.
				addRenderer({
					name: '@test/custom-element-renderer',
					serverEntrypoint: '@test/custom-element-renderer/server.js',
				});
				// Update the vite configuration.
				updateConfig({
					vite: getViteConfiguration(),
				});
			},
		},
	};
}
