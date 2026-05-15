import { fileURLToPath } from 'node:url';
import { preact } from '@preact/preset-vite';
import * as devalue from 'devalue';
const babelCwd = new URL('../', import.meta.url);
function getRenderer(development) {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development ? '@astrojs/preact/client-dev.js' : '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
	};
}
const getContainerRenderer = () => getRenderer(false);
function optionsPlugin(include, exclude) {
	const virtualModule = 'astro:preact:opts';
	const virtualModuleId = '\0' + virtualModule;
	return {
		name: '@astrojs/preact:opts',
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
				};
				return {
					code: `export default ${devalue.uneval(opts)}`,
				};
			},
		},
	};
}
function index_default({ include, exclude, compat, devtools, babel } = {}) {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, command, injectScript }) => {
				const preactPlugin = preact({
					reactAliasesEnabled: compat ?? false,
					include,
					exclude,
					babel: {
						...babel,
						cwd: fileURLToPath(babelCwd),
					},
				});
				const viteConfig = {
					optimizeDeps: {
						// Ideally would be environment config, but
						// putting it there does not result in it being optimized
						include: ['@astrojs/preact/server.js'],
					},
				};
				viteConfig.plugins = [
					preactPlugin,
					optionsPlugin(include, exclude),
					configEnvironmentPlugin(compat),
				];
				addRenderer(getRenderer(command === 'dev'));
				updateConfig({
					vite: viteConfig,
				});
				if (command === 'dev' && devtools) {
					injectScript('page', 'import "preact/debug";');
				}
			},
			'astro:config:done': ({ logger, config }) => {
				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);
				if (enabledKnownJsxRenderers.length > 1 && !include && !exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/preact/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}
function configEnvironmentPlugin(compat) {
	return {
		name: '@astrojs/preact:environment',
		configEnvironment(environmentName, options) {
			const environmentOptions = {
				optimizeDeps: {},
				resolve: {},
			};
			if (environmentName === 'client') {
				environmentOptions.optimizeDeps.include = [
					'@astrojs/preact/client.js',
					'preact',
					'preact/jsx-runtime',
					'preact/hooks',
					'@astrojs/preact > @preact/signals',
				];
			}
			if (compat) {
				environmentOptions.resolve = {
					dedupe: ['preact/compat', 'preact'],
				};
				if (environmentName === 'client') {
					environmentOptions.optimizeDeps.include.push(
						'preact/compat',
						'preact/test-utils',
						'preact/compat/jsx-runtime',
					);
				}
				if (
					!options.resolve?.noExternal &&
					(environmentName === 'ssr' || environmentName === 'prerender')
				) {
					environmentOptions.resolve.noExternal = [
						'react',
						'react-dom',
						'react-dom/test-utils',
						'react/jsx-runtime',
					];
				}
			}
			return environmentOptions;
		},
	};
}
export { index_default as default, getContainerRenderer };
