import type { AstroIntegration } from 'astro';
import { version as ReactVersion } from 'react-dom';
import type * as vite from 'vite';

function getRenderer() {
	return {
		name: '@astrojs/react',
		clientEntrypoint: ReactVersion.startsWith('18.')
			? '@astrojs/react/client.js'
			: '@astrojs/react/client-v17.js',
		serverEntrypoint: ReactVersion.startsWith('18.')
			? '@astrojs/react/server.js'
			: '@astrojs/react/server-v17.js',
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
							runtime: 'automatic',
							// This option tells the JSX transform how to construct the "*/jsx-runtime" import.
							// In React v17, we had to shim this due to an export map issue in React.
							// In React v18, this issue was fixed and we can import "react/jsx-runtime" directly.
							// See `./jsx-runtime.js` for more details.
							importSource: ReactVersion.startsWith('18.') ? 'react' : '@astrojs/react',
						}
					),
				],
			};
		},
	};
}

function optionsPlugin(experimentalReactChildren: boolean): vite.Plugin {
	const virtualModule = 'astro:react:opts';
	const virtualModuleId = '\0' + virtualModule;
	return {
		name: '@astrojs/react:opts',
		resolveId(id) {
			if (id === virtualModule) {
				return virtualModuleId;
			}
		},
		load(id) {
			if (id === virtualModuleId) {
				return {
					code: `export default {
						experimentalReactChildren: ${JSON.stringify(experimentalReactChildren)}
					}`,
				};
			}
		},
	};
}

function getViteConfiguration(experimentalReactChildren: boolean) {
	return {
		optimizeDeps: {
			include: [
				ReactVersion.startsWith('18.')
					? '@astrojs/react/client.js'
					: '@astrojs/react/client-v17.js',
				'react',
				'react/jsx-runtime',
				'react/jsx-dev-runtime',
				'react-dom',
			],
			exclude: [
				ReactVersion.startsWith('18.')
					? '@astrojs/react/server.js'
					: '@astrojs/react/server-v17.js',
			],
		},
		resolve: {
			dedupe: ['react', 'react-dom'],
		},
		ssr: {
			external: ReactVersion.startsWith('18.')
				? ['react-dom/server', 'react-dom/client']
				: ['react-dom/server.js', 'react-dom/client.js'],
			noExternal: [
				// These are all needed to get mui to work.
				'@mui/material',
				'@mui/base',
				'@babel/runtime',
				'redoc',
				'use-immer',
			],
		},
		plugins: [optionsPlugin(experimentalReactChildren)],
	};
}

export type ReactIntegrationOptions = {
	experimentalReactChildren: boolean;
};

export default function (
	{ experimentalReactChildren }: ReactIntegrationOptions = { experimentalReactChildren: false }
): AstroIntegration {
	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: getViteConfiguration(experimentalReactChildren) });
			},
		},
	};
}
