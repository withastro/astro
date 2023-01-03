import type { Options } from '@sveltejs/vite-plugin-svelte';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { UserConfig } from 'vite';

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
};

function getViteConfiguration({ options, isDev }: ViteConfigurationArgs): UserConfig {
	const defaultOptions: Partial<Options> = {
		emitCss: true,
		compilerOptions: { dev: isDev, hydratable: true },
		preprocess: [vitePreprocess()],
	};

	// Disable hot mode during the build
	if (!isDev) {
		defaultOptions.hot = false;
	}

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
			include: ['@astrojs/svelte/client.js'],
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
			'astro:config:setup': ({ command, updateConfig, addRenderer }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: getViteConfiguration({
						options,
						isDev: command === 'dev',
					}),
				});
			},
		},
	};
}
