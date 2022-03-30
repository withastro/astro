import { AstroIntegration } from 'astro';
import { version as ReactVersion } from 'react-dom';

function getRenderer() {
	return {
		name: '@astrojs/react',
		clientEntrypoint: ReactVersion.startsWith('18.') ? '@astrojs/react/client.js' : '@astrojs/react/client-v17.js',
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
			external: ['react-dom/server.js', 'react-dom/client.js'],
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
