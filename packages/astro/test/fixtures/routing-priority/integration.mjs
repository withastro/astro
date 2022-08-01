export default function() {
	return {
		name: '@astrojs/test-integration',
			hooks: {
				'astro:config:setup': ({ injectRoute }) => {
					injectRoute({
						pattern: '/injected',
						entryPoint: './src/to-inject.astro'
					});
					injectRoute({
						pattern: '/_injected',
						entryPoint: './src/_to-inject.astro'
					});
					injectRoute({
						pattern: '/[id]',
						entryPoint: './src/[id].astro'
					});
				}
			}
	}
}
