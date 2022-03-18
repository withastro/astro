import { AstroIntegration } from 'astro';

function getRenderer() {
	return {
		name: '@astrojs/react',
		clientEntrypoint: '@astrojs/react/client.js',
		serverEntrypoint: '@astrojs/react/server.js',
		jsxImportSource: 'react',
		jsxTransformOptions: async () => {
			const {
				default: { default: jsx },
				// @ts-expect-error types not found
			} = await import('@babel/plugin-transform-react-jsx');
			return {
				plugins: [
					jsx(
						{},
						{
							runtime: 'automatic',
							importSource: '@astrojs/react',
						}
					),
				],
			};
		},
	};
}

function getViteConfiguration() {
	return {
		optimizeDeps: {
			include: ['@astrojs/react/client.js', 'react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
			exclude: ['@astrojs/react/server.js'],
		},
		resolve: {
			dedupe: ['react', 'react-dom'],
		},
		ssr: {
			external: ['react-dom/server.js'],
		},
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: getViteConfiguration() });
			},
		},
	};
}
