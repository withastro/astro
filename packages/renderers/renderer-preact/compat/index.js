export default {
	name: '@astrojs/renderer-preact/compat',
	client: '../client.js',
	server: '../server.js',
	jsxImportSource: 'react',
	jsxTransformOptions: async () => {
		const {
			default: { default: jsx },
		} = await import('@babel/plugin-transform-react-jsx');
		return {
			plugins: [jsx({}, { runtime: 'automatic', importSource: 'preact/compat' })],
		};
	},
	viteConfig() {
		return {
			alias: {
				react: 'preact/compat',
				'react-dom': 'preact/compat',
			},
			resolve: {
				dedupe: ['react', 'react-dom'],
			},
			optimizeDeps: {
				include: ['@astrojs/renderer-preact/client.js', 'preact/compat', 'preact/compat/jsx-runtime', 'preact-render-to-string'],
			},
			ssr: {
				external: ['preact-render-to-string'],
			},
		};
	},
};
