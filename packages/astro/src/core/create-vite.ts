import type { AstroSettings } from '../@types/astro';
import type { LogOptions } from './logger/core';

import nodeFs from 'fs';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { crawlFrameworkPkgs } from 'vitefu';
import astroAssetsPlugin from '../assets/vite-plugin-assets.js';
import {
	astroContentAssetPropagationPlugin,
	astroContentImportPlugin,
	astroContentVirtualModPlugin,
} from '../content/index.js';
import astroPostprocessVitePlugin from '../vite-plugin-astro-postprocess/index.js';
import { vitePluginAstroServer } from '../vite-plugin-astro-server/index.js';
import astroVitePlugin from '../vite-plugin-astro/index.js';
import configAliasVitePlugin from '../vite-plugin-config-alias/index.js';
import envVitePlugin from '../vite-plugin-env/index.js';
import astroHeadPlugin from '../vite-plugin-head/index.js';
import htmlVitePlugin from '../vite-plugin-html/index.js';
import { astroInjectEnvTsPlugin } from '../vite-plugin-inject-env-ts/index.js';
import astroIntegrationsContainerPlugin from '../vite-plugin-integrations-container/index.js';
import jsxVitePlugin from '../vite-plugin-jsx/index.js';
import astroLoadFallbackPlugin from '../vite-plugin-load-fallback/index.js';
import markdownVitePlugin from '../vite-plugin-markdown/index.js';
import astroScannerPlugin from '../vite-plugin-scanner/index.js';
import astroScriptsPlugin from '../vite-plugin-scripts/index.js';
import astroScriptsPageSSRPlugin from '../vite-plugin-scripts/page-ssr.js';
import { vitePluginSSRManifest } from '../vite-plugin-ssr-manifest/index.js';
import astroTransitions from '../transitions/vite-plugin-transitions.js';
import { joinPaths } from './path.js';

interface CreateViteOptions {
	settings: AstroSettings;
	logging: LogOptions;
	mode: 'dev' | 'build' | string;
	// will be undefined when using `getViteConfig`
	command?: 'dev' | 'build';
	fs?: typeof nodeFs;
}

const ALWAYS_NOEXTERNAL = [
	// This is only because Vite's native ESM doesn't resolve "exports" correctly.
	'astro',
	// Vite fails on nested `.astro` imports without bundling
	'astro/components',
	// Handle recommended nanostores. Only @nanostores/preact is required from our testing!
	// Full explanation and related bug report: https://github.com/withastro/astro/pull/3667
	'@nanostores/preact',
	// fontsource packages are CSS that need to be processed
	'@fontsource/*',
];

// These specifiers are usually dependencies written in CJS, but loaded through Vite's transform
// pipeline, which Vite doesn't support in development time. This hardcoded list temporarily
// fixes things until Vite can properly handle them, or when they support ESM.
const ONLY_DEV_EXTERNAL = [
	// Imported by `<Code/>` which is processed by Vite
	'shiki',
	// Imported by `@astrojs/prism` which exposes `<Prism/>` that is processed by Vite
	'prismjs/components/index.js',
	// Imported by `astro/assets` -> `packages/astro/src/core/logger/core.ts`
	'string-width',
];

/** Return a common starting point for all Vite actions */
export async function createVite(
	commandConfig: vite.InlineConfig,
	{ settings, logging, mode, command, fs = nodeFs }: CreateViteOptions
): Promise<vite.InlineConfig> {
	const astroPkgsConfig = await crawlFrameworkPkgs({
		root: fileURLToPath(settings.config.root),
		isBuild: mode === 'build',
		viteUserConfig: settings.config.vite,
		isFrameworkPkgByJson(pkgJson) {
			// Certain packages will trigger the checks below, but need to be external. A common example are SSR adapters
			// for node-based platforms, as we need to control the order of the import paths to make sure polyfills are applied in time.
			if (pkgJson?.astro?.external === true) {
				return false;
			}

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
			markdownVitePlugin({ settings, logging }),
			htmlVitePlugin(),
			jsxVitePlugin({ settings, logging }),
			astroPostprocessVitePlugin(),
			mode === 'dev' && astroIntegrationsContainerPlugin({ settings, logging }),
			astroScriptsPageSSRPlugin({ settings }),
			astroHeadPlugin(),
			astroScannerPlugin({ settings }),
			astroInjectEnvTsPlugin({ settings, logging, fs }),
			astroContentVirtualModPlugin({ settings }),
			astroContentImportPlugin({ fs, settings }),
			astroContentAssetPropagationPlugin({ mode, settings }),
			vitePluginSSRManifest(),
			settings.config.experimental.assets ? [astroAssetsPlugin({ settings, logging, mode })] : [],
			astroTransitions(),
		],
		publicDir: fileURLToPath(settings.config.publicDir),
		root: fileURLToPath(settings.config.root),
		envPrefix: settings.config.vite?.envPrefix ?? 'PUBLIC_',
		define: {
			'import.meta.env.SITE': settings.config.site
				? JSON.stringify(settings.config.site)
				: 'undefined',
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
			noExternal: [...ALWAYS_NOEXTERNAL, ...astroPkgsConfig.ssr.noExternal],
			external: [...(mode === 'dev' ? ONLY_DEV_EXTERNAL : []), ...astroPkgsConfig.ssr.external],
		},
	};

	// If the user provides a custom assets prefix, make sure assets handled by Vite
	// are prefixed with it too. This uses one of it's experimental features, but it
	// has been stable for a long time now.
	const assetsPrefix = settings.config.build.assetsPrefix;
	if (assetsPrefix) {
		commonConfig.experimental = {
			renderBuiltUrl(filename, { type }) {
				if (type === 'asset') {
					return joinPaths(assetsPrefix, filename);
				}
			},
		};
	}

	// Merge configs: we merge vite configuration objects together in the following order,
	// where future values will override previous values.
	// 	 1. common vite config
	// 	 2. user-provided vite config, via AstroConfig
	//   3. integration-provided vite config, via the `config:setup` hook
	//   4. command vite config, passed as the argument to this function
	let result = commonConfig;
	// PR #6238 Calls user integration `astro:config:setup` hooks when running `astro sync`.
	// Without proper filtering, user integrations may run twice unexpectedly:
	// - with `command` set to `build/dev` (src/core/build/index.ts L72)
	// - and again in the `sync` module to generate `Content Collections` (src/core/sync/index.ts L36)
	// We need to check if the command is `build` or `dev` before merging the user-provided vite config.
	// We also need to filter out the plugins that are not meant to be applied to the current command:
	// - If the command is `build`, we filter out the plugins that are meant to be applied for `serve`.
	// - If the command is `dev`, we filter out the plugins that are meant to be applied for `build`.
	if (command && settings.config.vite?.plugins) {
		let { plugins, ...rest } = settings.config.vite;
		const applyToFilter = command === 'build' ? 'serve' : 'build';
		const applyArgs = [
			{ ...settings.config.vite, mode },
			{ command: command === 'dev' ? 'serve' : command, mode },
		];
		// @ts-expect-error ignore TS2589: Type instantiation is excessively deep and possibly infinite.
		plugins = plugins.flat(Infinity).filter((p) => {
			if (!p || p?.apply === applyToFilter) {
				return false;
			}

			if (typeof p.apply === 'function') {
				return p.apply(applyArgs[0], applyArgs[1]);
			}

			return true;
		});
		result = vite.mergeConfig(result, { ...rest, plugins });
	} else {
		result = vite.mergeConfig(result, settings.config.vite || {});
	}
	result = vite.mergeConfig(result, commandConfig);
	if (result.plugins) {
		sortPlugins(result.plugins);
	}

	result.customLogger = vite.createLogger(result.logLevel ?? 'warn');

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
