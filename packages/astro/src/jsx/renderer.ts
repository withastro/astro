const renderer = {
	name: 'astro:jsx',
	serverEntrypoint: 'astro/jsx/server.js',
	jsxImportSource: 'astro',
	jsxTransformOptions: async () => {
		// @ts-expect-error types not found
		const plugin = await import('@babel/plugin-transform-react-jsx');
		const jsx = plugin.default?.default ?? plugin.default;
		const { default: astroJSX } = await import('./babel.js');
		return {
			plugins: [
				astroJSX(),
				jsx({}, { throwIfNamespace: false, runtime: 'automatic', importSource: 'astro' }),
			],
		};
	},
};

export default renderer;
