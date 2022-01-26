export default {
	name: '@astrojs/renderer-solid',
	client: './client.js',
	server: './server.js',
	jsxImportSource: 'solid-js',
	jsxTransformOptions: async ({ ssr }) => {
		const [{ default: solid }] = await Promise.all([import('babel-preset-solid')]);
		const options = {
			presets: [solid({}, { generate: ssr ? 'ssr' : 'dom', hydratable: true })],
			plugins: [],
		};

		if (ssr) {
			options.plugins.push([
				'babel-plugin-module-resolver',
				{
					cwd: process.cwd(),
					alias: {
						'solid-js/store': 'solid-js/store/dist/server.js',
						'solid-js/web': 'solid-js/web/dist/server.js',
						'solid-js': 'solid-js/dist/server.js',
					},
				},
			]);
		}

		return options;
	},
	viteConfig(options) {
		// https://github.com/solidjs/vite-plugin-solid

		// We inject the dev mode only if the user explicitely wants it or if we are in dev (serve) mode
		const replaceDev = options.mode === 'development' || options.command === 'serve';

		const nestedDeps = ['solid-js', 'solid-js/web', 'solid-js/store', 'solid-js/html', 'solid-js/h'];

		return {
			/**
			 * We only need esbuild on .ts or .js files.
			 * .tsx & .jsx files are handled by us
			 */
			esbuild: { include: /\.ts$/ },
			resolve: {
				conditions: ['solid', ...(replaceDev ? ['development'] : [])],
				dedupe: nestedDeps,
				alias: [{ find: /^solid-refresh$/, replacement: '/@solid-refresh' }],
			},
			optimizeDeps: {
				include: nestedDeps,
				exclude: ['@astrojs/renderer-solid/server.js'],
			},
			ssr: {
				external: ['solid-js/web/dist/server.js', 'solid-js/store/dist/server.js', 'solid-js/dist/server.js', 'babel-preset-solid'],
			},
		};
	},
};
