import viteReact from '@vitejs/plugin-react';
import type { AstroRenderer } from 'astro';
import { getRenderer } from './container-renderer.js';
import type { RendererOptions } from './types.js';
import { getReactVersionConfig } from './version.js';

export type ReactRendererOptions = RendererOptions;

/**
 * Returns the React renderer for `astro({ renderers: [react()] })` from
 * `@astrojs/vite-plugin-astro`: plain data, applied by `astro()`. Compiling JSX is the job of
 * `@vitejs/plugin-react`, added to the Vite `plugins` next to `astro()`.
 *
 * @throws {Error} When the installed React version is not supported.
 */
export default function react(options: ReactRendererOptions = {}): AstroRenderer {
	const versionConfig = getReactVersionConfig();
	const {
		include,
		exclude,
		experimentalReactChildren = false,
		experimentalDisableStreaming = false,
	} = options;
	const dependencies = ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'];
	return {
		...getRenderer(versionConfig),
		options: {
			include,
			exclude,
			experimentalReactChildren,
			experimentalDisableStreaming,
		} satisfies RendererOptions,
		optimizeDeps: {
			client: {
				include: [...dependencies, 'react-dom/client', versionConfig.client],
				exclude: [versionConfig.server],
			},
			server: {
				include: [...dependencies, 'react-dom/server'],
				exclude: [versionConfig.server],
			},
		},
		dedupe: ['react', 'react-dom'],
		// These are all needed to get mui to work.
		noExternal: [
			'@mui/material',
			'@mui/base',
			'@babel/runtime',
			'use-immer',
			'@material-tailwind/react',
		],
		devHeadScript: viteReact.preambleCode,
	};
}
