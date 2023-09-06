import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration } from 'astro';
import { version as ReactVersion } from 'react-dom';
import type * as vite from 'vite';

export type ReactIntegrationOptions = Pick<ViteReactPluginOptions, 'include' | 'exclude'> & {
	experimentalReactChildren?: boolean;
};

const FAST_REFRESH_PREAMBLE = react.preambleCode;

function getRenderer() {
	return {
		name: '@astrojs/react',
		clientEntrypoint: ReactVersion.startsWith('18.')
			? '@astrojs/react/client.js'
			: '@astrojs/react/client-v17.js',
		serverEntrypoint: ReactVersion.startsWith('18.')
			? '@astrojs/react/server.js'
			: '@astrojs/react/server-v17.js',
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
	experimentalReactChildren,
}: ReactIntegrationOptions = {}) {
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
		plugins: [react({ include, exclude }), optionsPlugin(!!experimentalReactChildren)],
		resolve: {
			dedupe: ['react', 'react-dom', 'react-dom/server'],
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
	};
}

export default function ({
	include,
	exclude,
	experimentalReactChildren,
}: ReactIntegrationOptions = {}): AstroIntegration {
	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: getViteConfiguration({ include, exclude, experimentalReactChildren }),
				});
				if (command === 'dev') {
					const preamble = FAST_REFRESH_PREAMBLE.replace(`__BASE__`, '/');
					injectScript('before-hydration', preamble);
				}
			},
		},
	};
}
