import type { Options as VueOptions } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { Options as VueJsxOptions } from '@vitejs/plugin-vue-jsx';
import type { AstroIntegration, AstroRenderer, HookParameters } from 'astro';
import type { Plugin, PluginOption } from 'vite';
import type { VitePluginVueDevToolsOptions } from 'vite-plugin-vue-devtools';
import { APP_ENTRYPOINT_MODULE_ID } from './app-entrypoint-id.js';
import { getContainerRenderer as getContainerRendererImpl } from './container-renderer.js';
import vueRenderer, { vueJsxRenderer } from './renderer.js';

interface Options extends VueOptions {
	jsx?: boolean | VueJsxOptions;
	appEntrypoint?: string;
	devtools?: boolean | Omit<VitePluginVueDevToolsOptions, 'appendTo'>;
}

/**
 * @deprecated Import `getContainerRenderer` from `@astrojs/vue/container-renderer` instead.
 */
export function getContainerRenderer(): AstroRenderer {
	console.warn(
		'[@astrojs/vue] Importing `getContainerRenderer` from `@astrojs/vue` is deprecated. Import it from `@astrojs/vue/container-renderer` instead.',
	);
	return getContainerRendererImpl();
}

async function getViteConfiguration(
	command: HookParameters<'astro:config:setup'>['command'],
	options?: Options,
) {
	const vueOptions = {
		...options,
		template: {
			...options?.template,
			transformAssetUrls: false,
		},
	} satisfies VueOptions;

	// The vue vite plugin may not manage to resolve it automatically
	vueOptions.compiler ??= await import('vue/compiler-sfc');

	const plugins: PluginOption[] = [vue(vueOptions), configEnvironmentPlugin()];

	if (options?.jsx) {
		const vueJsx = (await import('@vitejs/plugin-vue-jsx')).default;
		const jsxOptions = typeof options.jsx === 'object' ? options.jsx : undefined;
		plugins.push(vueJsx(jsxOptions));
	}

	if (command === 'dev' && options?.devtools) {
		const vueDevTools = (await import('vite-plugin-vue-devtools')).default;
		const devToolsOptions =
			typeof options.devtools === 'object' && options.devtools ? options.devtools : {};
		const devToolsPlugins = (
			vueDevTools({
				...devToolsOptions,
				appendTo: APP_ENTRYPOINT_MODULE_ID,
			}) as Plugin[] | Plugin[][]
		).flat();
		plugins.push(
			configEnvironmentPlugin(),
			...devToolsPlugins.map((plugin) => ({
				...plugin,
				applyToEnvironment: (
					environment: Parameters<NonNullable<Plugin['applyToEnvironment']>>[0],
				) => environment.name === 'client',
			})),
		);
	}

	return { plugins };
}

function configEnvironmentPlugin(): Plugin {
	return {
		name: '@astrojs/vue:config-environment',
		configEnvironment(environmentName, _options) {
			if (
				(environmentName === 'ssr' || environmentName === 'prerender') &&
				_options.resolve?.noExternal !== true
			) {
				return {
					resolve: {
						external: ['vuetify', 'vueperslides', 'primevue'],
					},
				};
			}
		},
	};
}

/**
 * The Vue integration: `@vitejs/plugin-vue` (and `@vitejs/plugin-vue-jsx` with `jsx`) plus the
 * renderers from `@astrojs/vue/renderer`.
 */
export default function (options?: Options): AstroIntegration {
	return {
		name: '@astrojs/vue',
		hooks: {
			'astro:config:setup': async ({ addRenderer, updateConfig, command }) => {
				addRenderer(vueRenderer({ appEntrypoint: options?.appEntrypoint }));
				if (options?.jsx) {
					addRenderer(vueJsxRenderer());
				}
				updateConfig({ vite: await getViteConfiguration(command, options) });
			},
			'astro:config:done': ({ logger, config }) => {
				if (!options?.jsx) return;

				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);

				// This error can only be thrown from here since Vue is an optional JSX renderer
				if (enabledKnownJsxRenderers.length > 1 && !options?.include && !options?.exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/solid-js/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}
