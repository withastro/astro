import { AstroIntegration, AstroRenderer } from 'astro';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
		jsxImportSource: 'react',
		jsxTransformOptions: async () => {
			const {
				default: { default: jsx },
				// @ts-expect-error types not found
			} = await import('@babel/plugin-transform-react-jsx');
			return {
				plugins: [jsx({}, { runtime: 'automatic', importSource: 'preact/compat' })],
			};
		},
	};
}

function getViteConfiguration() {
	return {
		resolve: {
			alias: {
				react: 'preact/compat',
				'react-dom': 'preact/compat',
			},
			dedupe: ['react', 'react-dom'],
		},
		optimizeDeps: {
			include: [
				'@astrojs/preact/client.js',
				'preact/compat',
				'preact/jsx-runtime',
				'preact-render-to-string',
			],
		},
		ssr: {
			external: ['preact-render-to-string'],
		},
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/preact/compat',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: getViteConfiguration(),
				});
			},
		},
	};
}
