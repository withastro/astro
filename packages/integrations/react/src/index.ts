import path from 'node:path';
import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { FC, ReactNode } from 'react';
import type * as vite from 'vite';
import {
	getReactMajorVersion,
	isSupportedReactVersion,
	type ReactVersionConfig,
	versionsConfig,
} from './version.js';
import type { EnvironmentOptions } from 'vite';

const VIRTUAL_MODULE_ID = 'virtual:astro:react-app';
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'babel'
> & {
	experimentalReactChildren?: boolean;
	/**
	 * Disable streaming in React components
	 */
	experimentalDisableStreaming?: boolean;
	/**
	 * Path to a React component that wraps all React islands.
	 * The component receives the island as `children`.
	 */
	appEntrypoint?: string;
};

/**
 * Props for the `appEntrypoint` wrapper component.
 */
export interface AppEntrypointProps {
	/**
	 * The React island being wrapped.
	 */
	children?: ReactNode;
}

/**
 * Component type for the `appEntrypoint` wrapper.
 */
export type AppEntrypoint = FC<AppEntrypointProps>;

const FAST_REFRESH_PREAMBLE = react.preambleCode;

function getRenderer(reactConfig: ReactVersionConfig) {
	return {
		name: '@astrojs/react',
		clientEntrypoint: reactConfig.client,
		serverEntrypoint: reactConfig.server,
	};
}

function optionsPlugin({
	experimentalReactChildren = false,
	experimentalDisableStreaming = false,
}: {
	experimentalReactChildren: boolean;
	experimentalDisableStreaming: boolean;
}): vite.Plugin {
	const virtualModule = 'astro:react:opts';
	const virtualModuleId = '\0' + virtualModule;
	return {
		name: '@astrojs/react:opts',
		resolveId: {
			filter: {
				id: new RegExp(`^${virtualModule}$`),
			},
			handler() {
				return virtualModuleId;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${virtualModuleId}$`),
			},
			handler() {
				return {
					code: `export default {
						experimentalReactChildren: ${JSON.stringify(experimentalReactChildren)},
						experimentalDisableStreaming: ${JSON.stringify(experimentalDisableStreaming)}
					}`,
				};
			},
		},
	};
}

// A slightly modified version of `virtualAppEntrypoint` from packages/integrations/vue/src/index.ts
function virtualAppEntrypoint(appEntrypoint?: string): vite.Plugin {
	let isBuild: boolean;
	let root: string;
	let resolvedAppEntrypoint: string | undefined;

	return {
		name: '@astrojs/react:app',
		config(_, { command }) {
			isBuild = command === 'build';
		},
		configResolved(config) {
			root = config.root;
			if (appEntrypoint) {
				resolvedAppEntrypoint = appEntrypoint.startsWith('.')
					? path.resolve(root, appEntrypoint)
					: appEntrypoint;
			}
		},
		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_MODULE_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
			},
			handler() {
				if (resolvedAppEntrypoint) {
					return {
						code: `\
import _AppEntrypoint from ${JSON.stringify(resolvedAppEntrypoint)};
${
	!isBuild
		? `if (typeof _AppEntrypoint !== 'function') {
	console.warn("[@astrojs/react] appEntrypoint \`" + ${JSON.stringify(resolvedAppEntrypoint)} + "\` does not export a default React component.");
}`
		: ''
}
export const AppEntrypoint = _AppEntrypoint;`,
					};
				}
				return {
					code: `export const AppEntrypoint = undefined;`,
				};
			},
		},
	};
}

function getViteConfiguration(
	{
		include,
		exclude,
		babel,
		experimentalReactChildren,
		experimentalDisableStreaming,
		appEntrypoint,
	}: ReactIntegrationOptions = {},
	reactConfig: ReactVersionConfig,
) {
	return {
		plugins: [
			react({ include, exclude, babel }),
			optionsPlugin({
				experimentalReactChildren: !!experimentalReactChildren,
				experimentalDisableStreaming: !!experimentalDisableStreaming,
			}),
			virtualAppEntrypoint(appEntrypoint),
			configEnvironmentPlugin(reactConfig),
		],
		ssr: {
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

function configEnvironmentPlugin(reactConfig: ReactVersionConfig): vite.Plugin {
	return {
		name: '@astrojs/react:environment',
		configEnvironment(environmentName, options): EnvironmentOptions {
			const finalOptions: EnvironmentOptions = {
				resolve: {
					dedupe: ['react', 'react-dom'],
				},
				optimizeDeps: {},
			};

			if (
				environmentName === 'client' ||
				((environmentName === 'ssr' || environmentName === 'prerender') &&
					options.optimizeDeps?.noDiscovery === false)
			) {
				// SAFETY: we initialized it before
				finalOptions.optimizeDeps!.include = [
					'react',
					'react/jsx-runtime',
					'react/jsx-dev-runtime',
					'react-dom',
				];
				finalOptions.optimizeDeps!.exclude = [reactConfig.server];
				if (environmentName === 'ssr' || environmentName === 'prerender') {
					finalOptions.optimizeDeps!.include.push('react-dom/server');
					if (!options.resolve?.noExternal) {
						finalOptions.resolve!.noExternal = [
							// These are all needed to get mui to work.
							'@mui/material',
							'@mui/base',
							'@babel/runtime',
							'use-immer',
							'@material-tailwind/react',
						];
					}
				}
				if (environmentName === 'client') {
					finalOptions.optimizeDeps!.include.push('react-dom/client');
					finalOptions.optimizeDeps!.include.push(reactConfig.client);
				}
			}

			return finalOptions;
		},
	};
}

export default function ({
	include,
	exclude,
	babel,
	experimentalReactChildren,
	experimentalDisableStreaming,
	appEntrypoint,
}: ReactIntegrationOptions = {}): AstroIntegration {
	const majorVersion = getReactMajorVersion();
	if (!isSupportedReactVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion];

	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer(versionConfig));
				updateConfig({
					vite: getViteConfiguration(
						{
							include,
							exclude,
							babel,
							experimentalReactChildren,
							experimentalDisableStreaming,
							appEntrypoint,
						},
						versionConfig,
					),
				});
				if (command === 'dev') {
					const preamble = FAST_REFRESH_PREAMBLE.replace(`__BASE__`, '/');
					injectScript('before-hydration', preamble);
				}
			},
			'astro:config:done': ({ logger, config }) => {
				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);

				if (enabledKnownJsxRenderers.length > 1 && !include && !exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/react/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}

export function getContainerRenderer(): AstroRenderer {
	const majorVersion = getReactMajorVersion();
	if (!isSupportedReactVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	return getRenderer(versionsConfig[majorVersion]);
}
