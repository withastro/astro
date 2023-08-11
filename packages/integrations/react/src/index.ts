import type { AstroIntegration } from 'astro';
import { version as ReactVersion } from 'react-dom';
import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';

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

function getViteConfiguration({ include, exclude }: Options = {}) {
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
		plugins: [react({ include, exclude })],
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

export type Options = Pick<ViteReactPluginOptions, 'include' | 'exclude'>;
export default function ({
	include,
	exclude,
}: Pick<ViteReactPluginOptions, 'include' | 'exclude'> = {}): AstroIntegration {
	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ config, command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: getViteConfiguration({ include, exclude }) });
				if (command === 'dev') {
					const preamble = FAST_REFRESH_PREAMBLE.replace(
						`__BASE__`,
						appendForwardSlash(config.base)
					);
					injectScript('before-hydration', preamble);
				}
			},
		},
	};
}
