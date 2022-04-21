import { AstroIntegration } from 'astro';

function getRenderer() {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
		jsxImportSource: 'preact',
		jsxTransformOptions: async () => {
			const {
				default: { default: jsx },
				// @ts-expect-error types not found
			} = await import('@babel/plugin-transform-react-jsx');
			return {
				plugins: [jsx({}, { runtime: 'automatic', importSource: 'preact' })],
			};
		},
	};
}

function getViteConfiguration() {
	return {
		optimizeDeps: {
			include: [
				'@astrojs/preact/client.js',
				'preact',
				'preact/jsx-runtime',
				'preact-render-to-string',
			],
			exclude: ['@astrojs/preact/server.js'],
		},
		ssr: {
			external: ['preact-render-to-string'],
		},
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: getViteConfiguration(),
				})
			},
		},
	};
}
