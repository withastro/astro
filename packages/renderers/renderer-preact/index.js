export default {
	name: '@astrojs/renderer-preact',
	client: './client.js',
	server: './server.js',
	jsxImportSource: 'preact',
	jsxTransformOptions: async () => {
		const {
			default: { default: jsx },
		} = await import('@babel/plugin-transform-react-jsx');
		return {
			plugins: [jsx({}, { runtime: 'automatic', importSource: 'preact' })],
		};
	},
	viteConfig() {
		return {
			optimizeDeps: {
				include: ['@astrojs/renderer-preact/client.js', 'preact', 'preact/jsx-runtime', 'preact-render-to-string'],
				exclude: ['@astrojs/renderer-preact/server.js'],
			},
			ssr: {
				external: ['preact-render-to-string'],
			},
		};
	},
};
