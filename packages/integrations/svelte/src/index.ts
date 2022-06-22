import type { Options } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer, AstroConfig } from 'astro';
import type { UserConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte';
import preprocess from 'svelte-preprocess';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/svelte',
		clientEntrypoint: '@astrojs/svelte/client.js',
		serverEntrypoint: '@astrojs/svelte/server.js',
	};
}

type ViteConfigurationArgs = {
	isDev: boolean;
	options?: Options | OptionsCallback;
	postcssConfig: AstroConfig['style']['postcss'];
}

function getViteConfiguration({ options, postcssConfig, isDev }: ViteConfigurationArgs): UserConfig {
	const defaultOptions: Partial<Options> = {
		emitCss: true,
		compilerOptions: { dev: isDev, hydratable: true },
		preprocess: [
			preprocess({
				less: true,
				postcss: postcssConfig,
				sass: { renderSync: true },
				scss: { renderSync: true },
				stylus: true,
				typescript: true,
			}),
		],
	};

	let resolvedOptions: Partial<Options>;

	if (!options) {
		resolvedOptions = defaultOptions;
	} else if (typeof options === 'function') {
		resolvedOptions = options(defaultOptions);
	} else {
		resolvedOptions = {
			...options,
			...defaultOptions,
			compilerOptions: {
				...options.compilerOptions,
				// Always use dev and hydratable from defaults
				...defaultOptions.compilerOptions,
			},
			// Ignore default preprocessor if the user provided their own
			preprocess: options.preprocess ?? defaultOptions.preprocess,
		};
	}

	return {
		optimizeDeps: {
			include: ['@astrojs/svelte/client.js', 'svelte', 'svelte/internal'],
			exclude: ['@astrojs/svelte/server.js'],
		},
		plugins: [svelte(resolvedOptions)],
	};
}

type OptionsCallback = (defaultOptions: Options) => Options;
export default function (options?: Options | OptionsCallback): AstroIntegration {
	return {
		name: '@astrojs/svelte',
		hooks: {
			// Anything that gets returned here is merged into Astro Config
			'astro:config:setup': ({ command, updateConfig, addRenderer, config }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: getViteConfiguration({
						options,
						isDev: command === 'dev',
						postcssConfig: config.style.postcss,
					})
				});
			},
		},
	};
}
