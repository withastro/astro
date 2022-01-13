export default {
	name: '@astrojs/renderer-react',
	client: './client.js',
	server: './server.js',
	jsxImportSource: 'react',
	jsxTransformOptions: async () => {
		const {
			default: { default: jsx },
		} = await import('@babel/plugin-transform-react-jsx');
		return {
			plugins: [jsx({}, {
				runtime: 'automatic',
				importSource: '@astrojs/renderer-react'
			})],
		};
	},
	viteConfig() {
		return {
			optimizeDeps: {
				include: ['@astrojs/renderer-react/client.js', 'react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
				exclude: ['@astrojs/renderer-react/server.js'],
			},
			resolve: {
				dedupe: ['react', 'react-dom'],
			},
			ssr: {
				external: ['react-dom/server.js'],
			},
		};
	},
};
