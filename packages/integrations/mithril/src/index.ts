import { AstroIntegration } from 'astro';

function getRenderer() {
	return {
		name: '@astrojs/mithril',
    clientEntrypoint: '@astrojs/mithril/client.js',
    serverEntrypoint: '@astrojs/mithril/server.js',
		jsxImportSource: 'react',
		jsxTransformOptions: async () => {
			// @ts-expect-error types not found
			const babelPluginTransformReactJsxModule = await import('@babel/plugin-transform-react-jsx');
			const jsx =
				babelPluginTransformReactJsxModule?.default?.default ??
				babelPluginTransformReactJsxModule?.default;
			return {
				plugins: [
					jsx(
						{},
						{
              pragma: 'm',
              pragmaFrag: "'['"
						}
					),
				],
			};
		},
	};
}

function getViteConfiguration() {
	return {
		resolve: {
			dedupe: ['mithril'],
		}
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/mithril',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: getViteConfiguration() });
			},
		},
	};
}
