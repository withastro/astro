import type { AstroIntegration, AstroRenderer, ViteUserConfig } from 'astro';

function getRenderer(development: boolean): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development ? '@astrojs/preact/client-dev.js' : '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
		jsxImportSource: 'preact',
		jsxTransformOptions: async () => {
			// @ts-expect-error types not found
			const plugin = await import('@babel/plugin-transform-react-jsx');
			const jsx = plugin.default?.default ?? plugin.default;
			return {
				plugins: [jsx({}, { runtime: 'automatic', importSource: 'preact' })],
			};
		},
	};
}

function getCompatRenderer(development: boolean): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development ? '@astrojs/preact/client-dev.js' : '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
		jsxImportSource: 'react',
		jsxTransformOptions: async () => {
			// @ts-expect-error types not found
			const plugin = await import('@babel/plugin-transform-react-jsx');
			const jsx = plugin.default?.default ?? plugin.default;
			return {
				plugins: [
					jsx({}, { runtime: 'automatic', importSource: 'preact/compat' }),
					[
						'babel-plugin-module-resolver',
						{
							alias: {
								react: 'preact/compat',
								'react-dom/test-utils': 'preact/test-utils',
								'react-dom': 'preact/compat',
								'react/jsx-runtime': 'preact/jsx-runtime',
							},
						},
					],
				],
			};
		},
	};
}

function getViteConfiguration(compat?: boolean): ViteUserConfig {
	const viteConfig: ViteUserConfig = {
		optimizeDeps: {
			include: ['@astrojs/preact/client.js', 'preact', 'preact/jsx-runtime'],
			exclude: ['@astrojs/preact/server.js'],
		},
	};

	if (compat) {
		viteConfig.optimizeDeps!.include!.push(
			'preact/compat',
			'preact/test-utils',
			'preact/compat/jsx-runtime'
		);
		viteConfig.resolve = {
			alias: [
				{ find: 'react', replacement: 'preact/compat' },
				{ find: 'react-dom/test-utils', replacement: 'preact/test-utils' },
				{ find: 'react-dom', replacement: 'preact/compat' },
				{ find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' },
			],
			dedupe: ['preact/compat', 'preact'],
		};
		// noExternal React entrypoints to be bundled, resolved, and aliased by Vite
		viteConfig.ssr = {
			noExternal: ['react', 'react-dom', 'react-dom/test-utils', 'react/jsx-runtime'],
		};
	}

	return viteConfig;
}

export default function ({ compat }: { compat?: boolean } = {}): AstroIntegration {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, command }) => {
				const development = command === 'dev';
				if (compat) addRenderer(getCompatRenderer(development));
				addRenderer(getRenderer(development));
				updateConfig({
					vite: getViteConfiguration(compat),
				});
			},
		},
	};
}
