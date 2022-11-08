import type { AstroSettings } from '../@types/astro';
import type { LogOptions } from './logger/core';

import nodeFs from 'fs';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { crawlFrameworkPkgs } from 'vitefu';
import astroPostprocessVitePlugin from '../vite-plugin-astro-postprocess/index.js';
import { vitePluginAstroServer } from '../vite-plugin-astro-server/index.js';
import astroVitePlugin from '../vite-plugin-astro/index.js';
import configAliasVitePlugin from '../vite-plugin-config-alias/index.js';
import envVitePlugin from '../vite-plugin-env/index.js';
import astroHeadPropagationPlugin from '../vite-plugin-head-propagation/index.js';
import htmlVitePlugin from '../vite-plugin-html/index.js';
import astroIntegrationsContainerPlugin from '../vite-plugin-integrations-container/index.js';
import jsxVitePlugin from '../vite-plugin-jsx/index.js';
import astroLoadFallbackPlugin from '../vite-plugin-load-fallback/index.js';
import legacyMarkdownVitePlugin from '../vite-plugin-markdown-legacy/index.js';
import markdownVitePlugin from '../vite-plugin-markdown/index.js';
import astroScriptsPlugin from '../vite-plugin-scripts/index.js';
import astroScriptsPageSSRPlugin from '../vite-plugin-scripts/page-ssr.js';
import { createCustomViteLogger } from './errors/dev/index.js';
import astroScannerPlugin from '../vite-plugin-scanner/index.js';
import { resolveDependency } from './util.js';

interface CreateViteOptions {
	settings: AstroSettings;
	logging: LogOptions;
	mode: 'dev' | 'build' | string;
	fs?: typeof nodeFs;
}

const ALWAYS_NOEXTERNAL = new Set([
	// This is only because Vite's native ESM doesn't resolve "exports" correctly.
	'astro',
	// Vite fails on nested `.astro` imports without bundling
	'astro/components',
	// Handle recommended nanostores. Only @nanostores/preact is required from our testing!
	// Full explanation and related bug report: https://github.com/withastro/astro/pull/3667
	'@nanostores/preact',
	// fontsource packages are CSS that need to be processed
	'@fontsource/*',
]);

function getSsrNoExternalDeps(projectRoot: URL): string[] {
	let noExternalDeps = [];
	for (const dep of ALWAYS_NOEXTERNAL) {
		try {
			resolveDependency(dep, projectRoot);
			noExternalDeps.push(dep);
		} catch {
			// ignore dependency if *not* installed / present in your project
			// prevents hard error from Vite!
		}
	}
	return noExternalDeps;
}

/** Return a common starting point for all Vite actions */
export async function createVite(
	commandConfig: vite.InlineConfig,
	{ settings, logging, mode, fs = nodeFs }: CreateViteOptions
): Promise<vite.InlineConfig> {
	const astroPkgsConfig = await crawlFrameworkPkgs({
		root: fileURLToPath(settings.config.root),
		isBuild: mode === 'build',
		viteUserConfig: settings.config.vite,
		isFrameworkPkgByJson(pkgJson) {
			return (
				// Attempt: package relies on `astro`. ✅ Definitely an Astro package
				pkgJson.peerDependencies?.astro ||
				pkgJson.dependencies?.astro ||
				// Attempt: package is tagged with `astro` or `astro-component`. ✅ Likely a community package
				pkgJson.keywords?.includes('astro') ||
				pkgJson.keywords?.includes('astro-component') ||
				// Attempt: package is named `astro-something` or `@scope/astro-something`. ✅ Likely a community package
				/^(@[^\/]+\/)?astro\-/.test(pkgJson.name)
			);
		},
		isFrameworkPkgByName(pkgName) {
			const isNotAstroPkg = isCommonNotAstro(pkgName);
			if (isNotAstroPkg) {
				return false;
			} else {
				return undefined;
			}
		},
	});

	// Start with the Vite configuration that Astro core needs
	const commonConfig: vite.InlineConfig = {
		cacheDir: fileURLToPath(new URL('./node_modules/.vite/', settings.config.root)), // using local caches allows Astro to be used in monorepos, etc.
		clearScreen: false, // we want to control the output, not Vite
		logLevel: 'warn', // log warnings and errors only
		appType: 'custom',
		optimizeDeps: {
			entries: ['src/**/*'],
			exclude: ['astro', 'node-fetch'],
		},
		plugins: [
			configAliasVitePlugin({ settings }),
			astroLoadFallbackPlugin({ fs, root: settings.config.root }),
			astroVitePlugin({ settings, logging }),
			astroScriptsPlugin({ settings }),
			// The server plugin is for dev only and having it run during the build causes
			// the build to run very slow as the filewatcher is triggered often.
			mode !== 'build' && vitePluginAstroServer({ settings, logging, fs }),
			envVitePlugin({ settings }),
			settings.config.legacy.astroFlavoredMarkdown
				? legacyMarkdownVitePlugin({ settings, logging })
				: markdownVitePlugin({ settings, logging }),
			htmlVitePlugin(),
			jsxVitePlugin({ settings, logging }),
			astroPostprocessVitePlugin({ settings }),
			astroIntegrationsContainerPlugin({ settings, logging }),
			astroScriptsPageSSRPlugin({ settings }),
			astroHeadPropagationPlugin({ settings }),
			astroScannerPlugin({ settings }),
		],
		publicDir: fileURLToPath(settings.config.publicDir),
		root: fileURLToPath(settings.config.root),
		envPrefix: 'PUBLIC_',
		define: {
			'import.meta.env.SITE': settings.config.site ? `'${settings.config.site}'` : 'undefined',
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
			postcss: settings.config.style.postcss || {},
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
			// Astro imports in third-party packages should use the same version as root
			dedupe: ['astro'],
		},
		ssr: {
			noExternal: [
				...getSsrNoExternalDeps(settings.config.root),
				...astroPkgsConfig.ssr.noExternal,
			],
			// shiki is imported by Code.astro, which is no-externalized (processed by Vite).
			// However, shiki's deps are in CJS and trips up Vite's dev SSR transform, externalize
			// shiki to load it with node instead.
			external: [...(mode === 'dev' ? ['shiki'] : []), ...astroPkgsConfig.ssr.external],
		},
	};

	// Merge configs: we merge vite configuration objects together in the following order,
	// where future values will override previous values.
	// 	 1. common vite config
	// 	 2. user-provided vite config, via AstroConfig
	//   3. integration-provided vite config, via the `config:setup` hook
	//   4. command vite config, passed as the argument to this function
	let result = commonConfig;
	result = vite.mergeConfig(result, settings.config.vite || {});
	result = vite.mergeConfig(result, commandConfig);
	if (result.plugins) {
		sortPlugins(result.plugins);
	}

	result.customLogger = createCustomViteLogger(result.logLevel ?? 'warn');

	return result;
}

function isVitePlugin(plugin: vite.PluginOption): plugin is vite.Plugin {
	return Boolean(plugin?.hasOwnProperty('name'));
}

function findPluginIndexByName(pluginOptions: vite.PluginOption[], name: string): number {
	return pluginOptions.findIndex(function (pluginOption) {
		// Use isVitePlugin to ignore nulls, booleans, promises, and arrays
		// CAUTION: could be a problem if a plugin we're searching for becomes async!
		return isVitePlugin(pluginOption) && pluginOption.name === name;
	});
}

function sortPlugins(pluginOptions: vite.PluginOption[]) {
	// HACK: move mdxPlugin to top because it needs to run before internal JSX plugin
	const mdxPluginIndex = findPluginIndexByName(pluginOptions, '@mdx-js/rollup');
	if (mdxPluginIndex === -1) return;
	const jsxPluginIndex = findPluginIndexByName(pluginOptions, 'astro:jsx');
	const mdxPlugin = pluginOptions[mdxPluginIndex];
	pluginOptions.splice(mdxPluginIndex, 1);
	pluginOptions.splice(jsxPluginIndex, 0, mdxPlugin);
}

const COMMON_DEPENDENCIES_NOT_ASTRO = [
	'autoprefixer',
	'react',
	'react-dom',
	'preact',
	'preact-render-to-string',
	'vue',
	'svelte',
	'solid-js',
	'lit',
	'cookie',
	'dotenv',
	'esbuild',
	'eslint',
	'jest',
	'postcss',
	'prettier',
	'astro',
	'tslib',
	'typescript',
	'vite',
];

const COMMON_PREFIXES_NOT_ASTRO = [
	'@webcomponents/',
	'@fontsource/',
	'@postcss-plugins/',
	'@rollup/',
	'@astrojs/renderer-',
	'@types/',
	'@typescript-eslint/',
	'eslint-',
	'jest-',
	'postcss-plugin-',
	'prettier-plugin-',
	'remark-',
	'rehype-',
	'rollup-plugin-',
	'vite-plugin-',
];

function isCommonNotAstro(dep: string): boolean {
	return (
		COMMON_DEPENDENCIES_NOT_ASTRO.includes(dep) ||
		COMMON_PREFIXES_NOT_ASTRO.some(
			(prefix) =>
				prefix.startsWith('@')
					? dep.startsWith(prefix)
					: dep.substring(dep.lastIndexOf('/') + 1).startsWith(prefix) // check prefix omitting @scope/
		)
	);
}

interface PkgJSON {
	name: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	keywords?: string[];
	[key: string]: any;
}
