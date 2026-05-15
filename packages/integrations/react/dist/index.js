import react from '@vitejs/plugin-react';
import { getReactMajorVersion, isSupportedReactVersion, versionsConfig } from './version.js';
import * as devalue from 'devalue';
const FAST_REFRESH_PREAMBLE = react.preambleCode;
function getRenderer(reactConfig) {
	return {
		name: '@astrojs/react',
		clientEntrypoint: reactConfig.client,
		serverEntrypoint: reactConfig.server,
	};
}
function optionsPlugin({
	include,
	exclude,
	experimentalReactChildren = false,
	experimentalDisableStreaming = false,
}) {
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
				const opts = {
					include,
					exclude,
					experimentalReactChildren,
					experimentalDisableStreaming,
				};
				return {
					code: `export default ${devalue.uneval(opts)}`,
				};
			},
		},
	};
}
function getViteConfiguration(
	{ include, exclude, babel, experimentalReactChildren, experimentalDisableStreaming } = {},
	reactConfig,
) {
	return {
		plugins: [
			react({ include, exclude, babel }),
			optionsPlugin({
				include,
				exclude,
				experimentalReactChildren: !!experimentalReactChildren,
				experimentalDisableStreaming: !!experimentalDisableStreaming,
			}),
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
function configEnvironmentPlugin(reactConfig) {
	return {
		name: '@astrojs/react:environment',
		configEnvironment(environmentName, options) {
			const finalOptions = {
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
				finalOptions.optimizeDeps.include = [
					'react',
					'react/jsx-runtime',
					'react/jsx-dev-runtime',
					'react-dom',
				];
				finalOptions.optimizeDeps.exclude = [reactConfig.server];
				if (environmentName === 'ssr' || environmentName === 'prerender') {
					finalOptions.optimizeDeps.include.push('react-dom/server');
					if (!options.resolve?.noExternal) {
						finalOptions.resolve.noExternal = [
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
					finalOptions.optimizeDeps.include.push('react-dom/client');
					finalOptions.optimizeDeps.include.push(reactConfig.client);
				}
			}
			return finalOptions;
		},
	};
}
function index_default({
	include,
	exclude,
	babel,
	experimentalReactChildren,
	experimentalDisableStreaming,
} = {}) {
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
						{ include, exclude, babel, experimentalReactChildren, experimentalDisableStreaming },
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
function getContainerRenderer() {
	const majorVersion = getReactMajorVersion();
	if (!isSupportedReactVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	return getRenderer(versionsConfig[majorVersion]);
}
export { index_default as default, getContainerRenderer };
