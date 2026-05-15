import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { MagicString } from '@vue/compiler-sfc';
const VIRTUAL_MODULE_ID = 'virtual:astro:vue-app';
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
function getRenderer() {
	return {
		name: '@astrojs/vue',
		clientEntrypoint: '@astrojs/vue/client.js',
		serverEntrypoint: '@astrojs/vue/server.js',
	};
}
function getJsxRenderer() {
	return {
		name: '@astrojs/vue (jsx)',
		clientEntrypoint: '@astrojs/vue/client.js',
		serverEntrypoint: '@astrojs/vue/server.js',
	};
}
function virtualAppEntrypoint(options) {
	let isBuild;
	let root;
	let appEntrypoint;
	return {
		name: VIRTUAL_MODULE_ID,
		config(_, { command }) {
			isBuild = command === 'build';
		},
		configResolved(config) {
			root = config.root;
			if (options?.appEntrypoint) {
				appEntrypoint = options.appEntrypoint.startsWith('.')
					? path.resolve(root, options.appEntrypoint)
					: options.appEntrypoint;
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
				id: new RegExp(`^${RESOLVED_VIRTUAL_MODULE_ID}$`),
			},
			handler() {
				if (appEntrypoint) {
					return `export const setup = async (app) => {
	const mod = await import(${JSON.stringify(appEntrypoint)});

	if ('default' in mod) {
		await mod.default(app);
	} else {
		${
			!isBuild
				? `console.warn("[@astrojs/vue] appEntrypoint \`" + ${JSON.stringify(
						appEntrypoint,
					)} + "\` does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/vue/#appentrypoint.");`
				: ''
		}
	}
}`;
				}
				return `export const setup = () => {};`;
			},
		},
		// Ensure that Vue components reference appEntrypoint directly
		// This allows Astro to associate global styles imported in this file
		// with the pages they should be injected to
		transform: {
			filter: {
				id: /\.vue$/,
			},
			handler(code) {
				if (!appEntrypoint) return;
				const s = new MagicString(code);
				s.prepend(`import ${JSON.stringify(appEntrypoint)};
`);
				return {
					code: s.toString(),
					map: s.generateMap({ hires: 'boundary' }),
				};
			},
		},
	};
}
async function getViteConfiguration(command, options) {
	const vueOptions = {
		...options,
		template: {
			...options?.template,
			transformAssetUrls: false,
		},
	};
	vueOptions.compiler ??= await import('vue/compiler-sfc');
	const config = {
		plugins: [vue(vueOptions), virtualAppEntrypoint(vueOptions), configEnvironmentPlugin()],
	};
	if (options?.jsx) {
		const vueJsx = (await import('@vitejs/plugin-vue-jsx')).default;
		const jsxOptions = typeof options.jsx === 'object' ? options.jsx : void 0;
		config.plugins?.push(vueJsx(jsxOptions));
	}
	if (command === 'dev' && options?.devtools) {
		const vueDevTools = (await import('vite-plugin-vue-devtools')).default;
		const devToolsOptions = typeof options.devtools === 'object' ? options.devtools : {};
		config.plugins?.push(
			configEnvironmentPlugin(),
			vueDevTools({
				...devToolsOptions,
				appendTo: VIRTUAL_MODULE_ID,
			}),
		);
	}
	return config;
}
function configEnvironmentPlugin() {
	return {
		name: '@astrojs/vue:config-environment',
		configEnvironment(environmentName, _options) {
			const environmentOptions = {
				optimizeDeps: {},
			};
			if (
				environmentName === 'client' ||
				((environmentName === 'ssr' || environmentName === 'prerender') &&
					_options.optimizeDeps?.noDiscovery === false)
			) {
				environmentOptions.optimizeDeps.include = ['vue'];
				environmentOptions.optimizeDeps.exclude = [
					'@astrojs/vue/server.js',
					'vue/server-renderer',
					VIRTUAL_MODULE_ID,
				];
			}
			if (environmentName === 'client') {
				environmentOptions.optimizeDeps.include = ['@astrojs/vue/client.js', 'vue'];
			}
			if (
				(environmentName === 'ssr' || environmentName === 'prerender') &&
				_options.resolve?.noExternal !== true
			) {
				environmentOptions.resolve = {
					external: ['vuetify', 'vueperslides', 'primevue'],
				};
			}
			return environmentOptions;
		},
	};
}
function index_default(options) {
	return {
		name: '@astrojs/vue',
		hooks: {
			'astro:config:setup': async ({ addRenderer, updateConfig, command }) => {
				addRenderer(getRenderer());
				if (options?.jsx) {
					addRenderer(getJsxRenderer());
				}
				updateConfig({ vite: await getViteConfiguration(command, options) });
			},
			'astro:config:done': ({ logger, config }) => {
				if (!options?.jsx) return;
				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);
				if (enabledKnownJsxRenderers.length > 1 && !options?.include && !options?.exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/solid-js/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}
export { index_default as default, getRenderer as getContainerRenderer };
