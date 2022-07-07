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

// Some packages are just external, and that’s the way it goes.
const ALWAYS_EXTERNAL = new Set([
	...builtinModules.map((name) => `node:${name}`),
	'@sveltejs/vite-plugin-svelte',
	'micromark-util-events-to-acorn',
	'@astrojs/markdown-remark',
	'node-fetch',
	'prismjs',
	'shiki',
	'unified',
	'whatwg-url',
]);
const ALWAYS_NOEXTERNAL = new Set([
	// This is only because Vite's native ESM doesn't resolve "exports" correctly.
	'astro',
	// Handle recommended nanostores. Only @nanostores/preact is required from our testing!
	// Full explanation and related bug report: https://github.com/withastro/astro/pull/3667
	'@nanostores/preact',
]);

// note: ssr is still an experimental API hence the type omission from `vite`
export type ViteConfigWithSSR = vite.InlineConfig & { ssr?: vite.SSROptions };

interface CreateViteOptions {
	astroConfig: AstroConfig;
	logging: LogOptions;
	mode: 'dev' | 'build';
}

/** Return a common starting point for all Vite actions */
export async function createVite(
	commandConfig: ViteConfigWithSSR,
	{ astroConfig, logging, mode }: CreateViteOptions
): Promise<ViteConfigWithSSR> {
	// Scan for any third-party Astro packages. Vite needs these to be passed to `ssr.noExternal`.
	const astroPackages = await getAstroPackages(astroConfig);
	// Start with the Vite configuration that Astro core needs
	const commonConfig: ViteConfigWithSSR = {
		cacheDir: fileURLToPath(new URL('./node_modules/.vite/', astroConfig.root)), // using local caches allows Astro to be used in monorepos, etc.
		clearScreen: false, // we want to control the output, not Vite
		logLevel: 'warn', // log warnings and errors only
		optimizeDeps: {
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
		server: {
			force: true, // force dependency rebuild (TODO: enabled only while next is unstable; eventually only call in "production" mode?)
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
		// Note: SSR API is in beta (https://vitejs.dev/guide/ssr.html)
		ssr: {
			external: [...ALWAYS_EXTERNAL],
			noExternal: [...ALWAYS_NOEXTERNAL, ...astroPackages],
		},
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

// Scans `projectRoot` for third-party Astro packages that could export an `.astro` file
// `.astro` files need to be built by Vite, so these should use `noExternal`
async function getAstroPackages({ root }: AstroConfig): Promise<string[]> {
	const pkgUrl = new URL('./package.json', root);
	const pkgPath = fileURLToPath(pkgUrl);
	if (!fs.existsSync(pkgPath)) return [];

	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	const deps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

	return deps.filter((dep) => {
		// Attempt: package is common and not Astro. ❌ Skip these for perf
		if (isCommonNotAstro(dep)) return false;
		// Attempt: package is named `astro-something`. ✅ Likely a community package
		if (/^astro\-/.test(dep)) return true;
		const depPkgUrl = new URL(`./node_modules/${dep}/package.json`, root);
		const depPkgPath = fileURLToPath(depPkgUrl);
		if (!fs.existsSync(depPkgPath)) return false;

		const {
			dependencies = {},
			peerDependencies = {},
			keywords = [],
		} = JSON.parse(fs.readFileSync(depPkgPath, 'utf-8'));
		// Attempt: package relies on `astro`. ✅ Definitely an Astro package
		if (peerDependencies.astro || dependencies.astro) return true;
		// Attempt: package is tagged with `astro` or `astro-component`. ✅ Likely a community package
		if (keywords.includes('astro') || keywords.includes('astro-component')) return true;
		return false;
	});
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
