import { AstroIntegration } from 'astro';

function getRenderer({reactVersion}: {reactVersion: 17 | 18}) {
	return {
		name: '@astrojs/react',
		clientEntrypoint: reactVersion >= 18 ? '@astrojs/react/client.js' : '@astrojs/react/client-v17.js',
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
							importSource: reactVersion >= 18 ? 'react' : '@astrojs/react',
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

export default function (options = {}): AstroIntegration {
	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': async ({ addRenderer, updateConfig }) => {
				const reactVersion = await (import('react-dom/client').then(() => 18 as 18).catch(() => 17 as 17));
				addRenderer(getRenderer({reactVersion}));
				updateConfig({ vite: getViteConfiguration() });
			},
		},
	};
}
