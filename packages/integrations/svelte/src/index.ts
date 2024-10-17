import { fileURLToPath } from 'node:url';
import type { Options } from '@sveltejs/vite-plugin-svelte';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { AstroIntegration, AstroRenderer, ContainerRenderer } from 'astro';
import { VERSION } from 'svelte/compiler';
import type { UserConfig } from 'vite';

const isSvelte5 = Number.parseInt(VERSION.split('.').at(0)!) >= 5;

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/svelte',
		clientEntrypoint: isSvelte5 ? '@astrojs/svelte/client-v5.js' : '@astrojs/svelte/client.js',
		serverEntrypoint: isSvelte5 ? '@astrojs/svelte/server-v5.js' : '@astrojs/svelte/server.js',
	};
}

export function getContainerRenderer(): ContainerRenderer {
	return {
		name: '@astrojs/svelte',
		serverEntrypoint: isSvelte5 ? '@astrojs/svelte/server-v5.js' : '@astrojs/svelte/server.js',
	};
}

async function svelteConfigHasPreprocess(root: URL) {
	const svelteConfigFiles = ['./svelte.config.js', './svelte.config.cjs', './svelte.config.mjs'];
	for (const file of svelteConfigFiles) {
		const filePath = fileURLToPath(new URL(file, root));
		try {
			// Suppress warnings by vite: "The above dynamic import cannot be analyzed by Vite."
			const config = (await import(/* @vite-ignore */ filePath)).default;
			return !!config.preprocess;
		} catch {}
	}
}

type ViteConfigurationArgs = {
	isDev: boolean;
	options?: Options | OptionsCallback;
	root: URL;
};

async function getViteConfiguration({
	options,
	isDev,
	root,
}: ViteConfigurationArgs): Promise<UserConfig> {
	const defaultOptions: Partial<Options> = {
		emitCss: true,
		compilerOptions: { dev: isDev },
	};

	// `hydratable` does not need to be set in Svelte 5 as it's always hydratable by default
	if (!isSvelte5) {
		// @ts-ignore ignore Partial type above
		defaultOptions.compilerOptions.hydratable = true;
	}

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
		};
	}

	if (!resolvedOptions.preprocess && !(await svelteConfigHasPreprocess(root))) {
		resolvedOptions.preprocess = vitePreprocess();
	}

	return {
		optimizeDeps: {
			include: [isSvelte5 ? '@astrojs/svelte/client-v5.js' : '@astrojs/svelte/client.js'],
			exclude: [isSvelte5 ? '@astrojs/svelte/server-v5.js' : '@astrojs/svelte/server.js'],
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
			'astro:config:setup': async ({ command, updateConfig, addRenderer, config }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: await getViteConfiguration({
						options,
						isDev: command === 'dev',
						root: config.root,
					}),
				});
			},
		},
	};
}

export { vitePreprocess };
