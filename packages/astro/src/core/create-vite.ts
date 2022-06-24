import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from './logger/core';

import fs from 'fs';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import astroPostprocessVitePlugin from '../vite-plugin-astro-postprocess/index.js';
import astroViteServerPlugin from '../vite-plugin-astro-server/index.js';
import astroVitePlugin from '../vite-plugin-astro/index.js';
import configAliasVitePlugin from '../vite-plugin-config-alias/index.js';
import envVitePlugin from '../vite-plugin-env/index.js';
import astroIntegrationsContainerPlugin from '../vite-plugin-integrations-container/index.js';
import jsxVitePlugin from '../vite-plugin-jsx/index.js';
import markdownVitePlugin from '../vite-plugin-markdown/index.js';
import astroScriptsPlugin from '../vite-plugin-scripts/index.js';

// note: ssr is still an experimental API hence the type omission from `vite`
export type ViteConfigWithSSR = vite.InlineConfig & { ssr?: vite.SSROptions };

interface CreateViteOptions {
	astroConfig: AstroConfig;
	logging: LogOptions;
	mode: 'dev' | 'build';
}

const ALWAYS_NOEXTERNAL = new Set([
	// This is only because Vite's native ESM doesn't resolve "exports" correctly.
	'astro',
	// Vite fails on nested `.astro` imports without bundling
	'astro/components',
]);

/** Return a common starting point for all Vite actions */
export async function createVite(
	commandConfig: ViteConfigWithSSR,
	{ astroConfig, logging, mode }: CreateViteOptions
): Promise<ViteConfigWithSSR> {
	// Start with the Vite configuration that Astro core needs
	const commonConfig: ViteConfigWithSSR = {
		cacheDir: fileURLToPath(new URL('./node_modules/.vite/', astroConfig.root)), // using local caches allows Astro to be used in monorepos, etc.
		clearScreen: false, // we want to control the output, not Vite
		logLevel: 'warn', // log warnings and errors only
		optimizeDeps: {
			force: true,
			entries: ['src/**/*'], // Try and scan a user’s project (won’t catch everything),
			exclude: ['node-fetch'],
		},
		plugins: [
			configAliasVitePlugin({ config: astroConfig }),
			astroVitePlugin({ config: astroConfig, logging }),
			astroScriptsPlugin({ config: astroConfig }),
			// The server plugin is for dev only and having it run during the build causes
			// the build to run very slow as the filewatcher is triggered often.
			mode === 'dev' && astroViteServerPlugin({ config: astroConfig, logging }),
			envVitePlugin({ config: astroConfig }),
			markdownVitePlugin({ config: astroConfig }),
			jsxVitePlugin({ config: astroConfig, logging }),
			astroPostprocessVitePlugin({ config: astroConfig }),
			astroIntegrationsContainerPlugin({ config: astroConfig }),
		],
		publicDir: fileURLToPath(astroConfig.publicDir),
		root: fileURLToPath(astroConfig.root),
		envPrefix: 'PUBLIC_',
		define: {
			'import.meta.env.SITE': astroConfig.site ? `'${astroConfig.site}'` : 'undefined',
		},
		// fixes HMR for static components
		// TODO: remove!
		legacy: {
			devDepsScanner: true,
		},
		server: {
			hmr:
				process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production'
					? false
					: undefined, // disable HMR for test
			// handle Vite URLs
			proxy: {
				// add proxies here
			},
			watch: {
				// Prevent watching during the build to speed it up
				ignored: mode === 'build' ? ['**'] : undefined,
			},
		},
		css: {
			postcss: astroConfig.style.postcss || {},
		},
		resolve: {
			alias: [
				{
					// This is needed for Deno compatibility, as the non-browser version
					// of this module depends on Node `crypto`
					find: 'randombytes',
					replacement: 'randombytes/browser',
				},
				{
					// Typings are imported from 'astro' (e.g. import { Type } from 'astro')
					find: /^astro$/,
					replacement: fileURLToPath(new URL('../@types/astro', import.meta.url)),
				},
			],
			conditions: ['astro'],
		},
		ssr: {
			noExternal: [...ALWAYS_NOEXTERNAL],
		}
	};

	// Merge configs: we merge vite configuration objects together in the following order,
	// where future values will override previous values.
	// 	 1. common vite config
	// 	 2. user-provided vite config, via AstroConfig
	//   3. integration-provided vite config, via the `config:setup` hook
	//   4. command vite config, passed as the argument to this function
	let result = commonConfig;
	result = vite.mergeConfig(result, astroConfig.vite || {});
	result = vite.mergeConfig(result, commandConfig);
	sortPlugins(result);

	return result;
}

function getPluginName(plugin: vite.PluginOption) {
	if (plugin && typeof plugin === 'object' && !Array.isArray(plugin)) {
		return plugin.name;
	}
}

function sortPlugins(result: ViteConfigWithSSR) {
	// HACK: move mdxPlugin to top because it needs to run before internal JSX plugin
	const mdxPluginIndex =
		result.plugins?.findIndex((plugin) => getPluginName(plugin) === '@mdx-js/rollup') ?? -1;
	if (mdxPluginIndex === -1) return;
	const jsxPluginIndex =
		result.plugins?.findIndex((plugin) => getPluginName(plugin) === 'astro:jsx') ?? -1;
	const mdxPlugin = result.plugins?.[mdxPluginIndex];
	result.plugins?.splice(mdxPluginIndex, 1);
	result.plugins?.splice(jsxPluginIndex, 0, mdxPlugin);
}
