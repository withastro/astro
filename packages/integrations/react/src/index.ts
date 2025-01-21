import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration, ContainerRenderer } from 'astro';
import type * as vite from 'vite';
import {
	type ReactVersionConfig,
	type SupportedReactVersion,
	getReactMajorVersion,
	isUnsupportedVersion,
	versionsConfig,
} from './version.js';

export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'babel'
> & {
	experimentalReactChildren?: boolean;
	/**
	 * Disable streaming support for React components in order to support libraries that are not compatible with streaming like Stitches.js
	 */
	experimentalDisableStreaming?: boolean;
};

const FAST_REFRESH_PREAMBLE = react.preambleCode;

function getRenderer(reactConfig: ReactVersionConfig) {
	return {
		name: '@astrojs/react',
		clientEntrypoint: reactConfig.client,
		serverEntrypoint: reactConfig.server,
	};
}

function optionsPlugin(
	experimentalReactChildren: boolean,
	experimentalDisableStreaming: boolean
): vite.Plugin {
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
						experimentalReactChildren: ${JSON.stringify(experimentalReactChildren)},
						experimentalDisableStreaming: ${JSON.stringify(experimentalDisableStreaming)}
					}`,
				};
			}
		},
	};
}

function getViteConfiguration(
	{ include, exclude, babel, experimentalReactChildren, experimentalDisableStreaming }: ReactIntegrationOptions = {},
	reactConfig: ReactVersionConfig,
) {
	return {
		optimizeDeps: {
			include: [
				reactConfig.client,
				'react',
				'react/jsx-runtime',
				'react/jsx-dev-runtime',
				'react-dom',
			],
			exclude: [reactConfig.server],
		},
		plugins: [
			react({ include, exclude, babel }),
			optionsPlugin(!!experimentalReactChildren, !!experimentalDisableStreaming),
		],
		resolve: {
			dedupe: ['react', 'react-dom', 'react-dom/server'],
		},
		ssr: {
			external: reactConfig.externals,
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
	experimentalDisableStreaming,
}: ReactIntegrationOptions = {}): AstroIntegration {
	const majorVersion = getReactMajorVersion();
	if (isUnsupportedVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion as SupportedReactVersion];

	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer(versionConfig));
				updateConfig({
					vite: getViteConfiguration(
						{ include, exclude, babel, experimentalReactChildren, experimentalDisableStreaming },
						versionConfig,
					),
				});
				if (command === 'dev') {
					const preamble = FAST_REFRESH_PREAMBLE.replace(`__BASE__`, '/');
					injectScript('before-hydration', preamble);
				}
			},
		},
	};
}

export function getContainerRenderer(): ContainerRenderer {
	const majorVersion = getReactMajorVersion();
	if (isUnsupportedVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion as SupportedReactVersion];

	return {
		name: '@astrojs/react',
		serverEntrypoint: versionConfig.server,
	};
}
