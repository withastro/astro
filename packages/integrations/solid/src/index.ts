import type { AstroIntegration, AstroRenderer } from 'astro';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/solid-js',
		clientEntrypoint: '@astrojs/solid-js/client.js',
		serverEntrypoint: '@astrojs/solid-js/server.js',
		jsxImportSource: 'solid-js',
		jsxTransformOptions: async ({ ssr }) => {
			// @ts-expect-error types not found
			const [{ default: solid }] = await Promise.all([import('babel-preset-solid')]);
			const options = {
				presets: [solid({}, { generate: ssr ? 'ssr' : 'dom', hydratable: true })],
				plugins: [],
			};

			return options;
		},
	};
}

function getViteConfiguration(isDev: boolean) {
	// https://github.com/solidjs/vite-plugin-solid
	// We inject the dev mode only if the user explicitely wants it or if we are in dev (serve) mode
	const nestedDeps = ['solid-js', 'solid-js/web', 'solid-js/store', 'solid-js/html', 'solid-js/h'];
	return {
		/**
		 * We only need esbuild on .ts or .js files.
		 * .tsx & .jsx files are handled by us
		 */
		esbuild: { include: /\.ts$/ },
		resolve: {
			conditions: ['solid', ...(isDev ? ['development'] : [])],
			dedupe: nestedDeps,
			alias: [{ find: /^solid-refresh$/, replacement: '/@solid-refresh' }],
		},
		optimizeDeps: {
			include: nestedDeps,
			exclude: ['@astrojs/solid-js/server.js'],
		},
		ssr: {
			external: ['babel-preset-solid'],
		},
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/solid-js',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: getViteConfiguration(command === 'dev') });
			},
		},
	};
}
