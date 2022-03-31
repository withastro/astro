import { AstroIntegration } from 'astro';
import { version as ReactVersion } from 'react-dom';

function getRenderer() {
	return {
		name: '@astrojs/react',
		clientEntrypoint: ReactVersion.startsWith('18.') ? '@astrojs/react/client.js' : '@astrojs/react/client-v17.js',
		serverEntrypoint: ReactVersion.startsWith('18.') ? '@astrojs/react/server.js' : '@astrojs/react/server-v17.js',
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
							importSource: ReactVersion.startsWith('18.') ? 'react' : '@astrojs/react',
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
			include: [ReactVersion.startsWith('18.') ? '@astrojs/react/client.js' : '@astrojs/react/client-v17.js', 'react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
			exclude: [ReactVersion.startsWith('18.') ? '@astrojs/react/server.js' : '@astrojs/react/server-v17.js'], 
		},
		resolve: {
			dedupe: ['react', 'react-dom'],
		},
		ssr: {
			external: ReactVersion.startsWith('18.') ? ['react-dom/server', 'react-dom/client'] : ['react-dom/server.js', 'react-dom/client.js'],
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
