import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration } from 'astro';
import type * as vite from 'vite';

export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'babel'
> & {
	experimentalReactChildren?: boolean;
};

const FAST_REFRESH_PREAMBLE = react.preambleCode;

function getRenderer() {
	return {
		name: '@astrojs/react',
		clientEntrypoint: '@astrojs/react/client.js',
		serverEntrypoint: '@astrojs/react/server.js'
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

function getViteConfiguration({
	include,
	exclude,
	babel,
	experimentalReactChildren,
}: ReactIntegrationOptions = {}) {
	return {
		optimizeDeps: {
			include: ['@astrojs/react/client.js',
				'react',
				'react/jsx-runtime',
				'react/jsx-dev-runtime',
				'react-dom',
			],
			exclude: [
					'@astrojs/react/server.js'
			],
		},
		plugins: [react({ include, exclude, babel }), optionsPlugin(!!experimentalReactChildren)],
		resolve: {
			dedupe: ['react', 'react-dom', 'react-dom/server'],
		},
		ssr: {
			external: ['react-dom/server', 'react-dom/client'],
			noExternal: [
				// These are all needed to get mui to work.
				'@mui/material',
				'@mui/base',
				'@babel/runtime',
				'use-immer',
				'@material-tailwind/react',
			],
		},
	};
}

export default function ({
	include,
	exclude,
	babel,
	experimentalReactChildren,
}: ReactIntegrationOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: getViteConfiguration({ include, exclude, babel, experimentalReactChildren }),
				});
				if (command === 'dev') {
					const preamble = FAST_REFRESH_PREAMBLE.replace(`__BASE__`, '/');
					injectScript('before-hydration', preamble);
				}
			},
		},
	};
}
