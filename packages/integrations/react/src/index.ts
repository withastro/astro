import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type * as vite from 'vite';
import {
	getReactMajorVersion,
	isSupportedReactVersion,
	type ReactVersionConfig,
	versionsConfig,
} from './version.js';

type ReactCompilerOptions = {
	compilationMode?: 'infer' | 'annotation' | 'syntax' | 'all';
	target?: '17' | '18' | '19';
	panicThreshold?: 'none' | 'critical_errors' | 'all_errors';
	logger?: {
		logEvent: (filename: string | null, event: any) => void;
	} | null;
	gating?: {
		source: string;
		importSpecifierName: string;
	} | null;
};

export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'babel'
> & {
	experimentalReactChildren?: boolean;
	/**
	 * Disable streaming in React components
	 */
	experimentalDisableStreaming?: boolean;
	/*
	 * Enables the [React Compiler](https://react.dev/learn/react-compiler).
	 * Requires installing `babel-plugin-react-compiler`.
	 */
	reactCompilerEnabled?: boolean | ReactCompilerOptions;
};

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

type PluginItem = NonNullable<
	Exclude<NonNullable<ReactIntegrationOptions['babel']>, (...args: any[]) => any>['plugins']
>[number];

function isBabelPluginPresent(plugins: PluginItem[], pluginName: string): boolean {
	for (const plugin of plugins) {
		if (typeof plugin == 'string' && plugin == pluginName) return true;
		else if (Array.isArray(plugin) && plugin[0] == pluginName) return true;
	}
	return false;
}

function getViteConfiguration(
	{
		include,
		exclude,
		babel,
		experimentalReactChildren,
		experimentalDisableStreaming,
		reactCompilerEnabled,
	}: ReactIntegrationOptions = {},
	reactConfig: ReactVersionConfig,
) {
	if (reactCompilerEnabled) {
		if (!babel) babel = {};

		let reactCompilerDefinition;
		if (typeof reactCompilerEnabled != 'boolean')
			reactCompilerDefinition = ['babel-plugin-react-compiler', reactCompilerEnabled];
		else reactCompilerDefinition = ['babel-plugin-react-compiler'];

		if (typeof babel == 'object') {
			let reactCompilerPluginExists = false;
			if (!babel.plugins) babel.plugins = [];
			else {
				reactCompilerPluginExists = isBabelPluginPresent(
					babel.plugins,
					'babel-plugin-react-compiler',
				);
			}
			if (!reactCompilerPluginExists) babel.plugins.push(reactCompilerDefinition);
		} else if (typeof babel === 'function') {
			let reactCompilerPluginExists = false;
			const babelFn = babel;
			babel = (...args) => {
				const options = babelFn(...args);
				if (!options.plugins) options.plugins = [];
				else {
					reactCompilerPluginExists = isBabelPluginPresent(
						options.plugins,
						'babel-plugin-react-compiler',
					);
				}
				if (!reactCompilerPluginExists) options.plugins.push(reactCompilerDefinition);

				return options;
			};
		}

		// @ts-ignore
		import('babel-plugin-react-compiler').catch(() => {
			console.warn(
				"You need to install 'babel-plugin-react-compiler' as a dev dependency to use React Compiler in your Astro project.",
			);
		});
	}

	return {
		optimizeDeps: {
			include: [reactConfig.client],
			exclude: [reactConfig.server],
		},
		plugins: [
			react({ include, exclude, babel }),
			optionsPlugin({
				experimentalReactChildren: !!experimentalReactChildren,
				experimentalDisableStreaming: !!experimentalDisableStreaming,
			}),
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

export default function ({
	include,
	exclude,
	babel,
	experimentalReactChildren,
	experimentalDisableStreaming,
	reactCompilerEnabled,
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
							reactCompilerEnabled,
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
