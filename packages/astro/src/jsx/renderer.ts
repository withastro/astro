const renderer = {
	name: 'astro:jsx',
	serverEntrypoint: 'astro/jsx/server.js',
	jsxTransformOptions: async () => {
		const {
			default: { default: jsx },
			// @ts-ignore
		} = await import('@babel/plugin-transform-react-jsx');
		const { default: astroJSX } = await import('./babel.js');
		return {
			plugins: [
				astroJSX(),
				jsx({}, { throwIfNamespace: false, runtime: 'automatic' }),
			],
		};
	},
};

export default renderer;
