import type { AstroSettings } from '../@types/astro';
import type { LogOptions } from './logger/core';

import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import astroPostprocessVitePlugin from '../vite-plugin-astro-postprocess/index.js';
import astroViteServerPlugin from '../vite-plugin-astro-server/index.js';
import astroVitePlugin from '../vite-plugin-astro/index.js';
import configAliasVitePlugin from '../vite-plugin-config-alias/index.js';
import envVitePlugin from '../vite-plugin-env/index.js';
import htmlVitePlugin from '../vite-plugin-html/index.js';
import astroIntegrationsContainerPlugin from '../vite-plugin-integrations-container/index.js';
import jsxVitePlugin from '../vite-plugin-jsx/index.js';
import legacyMarkdownVitePlugin from '../vite-plugin-markdown-legacy/index.js';
import markdownVitePlugin from '../vite-plugin-markdown/index.js';
import astroScriptsPlugin from '../vite-plugin-scripts/index.js';
import astroScriptsPageSSRPlugin from '../vite-plugin-scripts/page-ssr.js';
import { createCustomViteLogger } from './errors.js';
import { resolveDependency } from './util.js';

interface CreateViteOptions {
	settings: AstroSettings;
	logging: LogOptions;
	mode: 'dev' | 'build' | string;
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
	{ settings, logging, mode }: CreateViteOptions
): Promise<vite.InlineConfig> {
	const thirdPartyAstroPackages = await getAstroPackages(settings);
	// Start with the Vite configuration that Astro core needs
	const commonConfig: vite.InlineConfig = {
		cacheDir: fileURLToPath(new URL('./node_modules/.vite/', settings.config.root)), // using local caches allows Astro to be used in monorepos, etc.
		clearScreen: false, // we want to control the output, not Vite
		logLevel: 'warn', // log warnings and errors only
		appType: 'custom',
		optimizeDeps: {
			entries: ['src/**/*'],
			exclude: ['node-fetch'],
		},
		plugins: [
			configAliasVitePlugin({ settings }),
			astroVitePlugin({ settings, logging }),
			astroScriptsPlugin({ settings }),
			// The server plugin is for dev only and having it run during the build causes
			// the build to run very slow as the filewatcher is triggered often.
			mode !== 'build' && astroViteServerPlugin({ settings, logging }),
			envVitePlugin({ settings }),
			settings.config.legacy.astroFlavoredMarkdown
				? legacyMarkdownVitePlugin({ settings, logging })
				: markdownVitePlugin({ settings, logging }),
			htmlVitePlugin(),
			jsxVitePlugin({ settings, logging }),
			astroPostprocessVitePlugin({ settings }),
			astroIntegrationsContainerPlugin({ settings, logging }),
			astroScriptsPageSSRPlugin({ settings }),
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
		},
		ssr: {
			noExternal: [...getSsrNoExternalDeps(settings.config.root), ...thirdPartyAstroPackages],
			// shiki is imported by Code.astro, which is no-externalized (processed by Vite).
			// However, shiki's deps are in CJS and trips up Vite's dev SSR transform, externalize
			// shiki to load it with node instead.
			external: mode === 'dev' ? ['shiki'] : [],
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

// Scans `projectRoot` for third-party Astro packages that could export an `.astro` file
// `.astro` files need to be built by Vite, so these should use `noExternal`
async function getAstroPackages(settings: AstroSettings): Promise<string[]> {
	const { astroPackages } = new DependencyWalker(settings.config.root);
	return astroPackages;
}

/**
 * Recursively walk a project’s dependency tree trying to find Astro packages.
 * - If the current node is an Astro package, we continue walking its child dependencies.
 * - If the current node is not an Astro package, we bail out of walking that branch.
 * This assumes it is unlikely for Astro packages to be dependencies of packages that aren’t
 * themselves also Astro packages.
 */
class DependencyWalker {
	private readonly require: NodeRequire;
	private readonly astroDeps = new Set<string>();
	private readonly nonAstroDeps = new Set<string>();

	constructor(root: URL) {
		const pkgUrl = new URL('./package.json', root);
		this.require = createRequire(pkgUrl);
		const pkgPath = fileURLToPath(pkgUrl);
		if (!fs.existsSync(pkgPath)) return;

		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
		const deps = [
			...Object.keys(pkg.dependencies || {}),
			...Object.keys(pkg.devDependencies || {}),
		];

		this.scanDependencies(deps);
	}

	/** The dependencies we determined were likely to include `.astro` files. */
	public get astroPackages(): string[] {
		return Array.from(this.astroDeps);
	}

	private seen(dep: string): boolean {
		return this.astroDeps.has(dep) || this.nonAstroDeps.has(dep);
	}

	/** Try to load a directory’s `package.json` file from the filesystem. */
	private readPkgJSON(dir: string): PkgJSON | void {
		try {
			const filePath = path.join(dir, 'package.json');
			return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		} catch (e) {}
	}

	/** Try to resolve a dependency’s `package.json` even if not a package export. */
	private resolvePkgJSON(dep: string): PkgJSON | void {
		try {
			const pkgJson: PkgJSON = this.require(dep + '/package.json');
			return pkgJson;
		} catch (e) {
			// Most likely error is that the dependency doesn’t include `package.json` in its package `exports`.
			try {
				// Walk up from default export until we find `package.json` with name === dep.
				let dir = path.dirname(this.require.resolve(dep));
				while (dir) {
					const pkgJSON = this.readPkgJSON(dir);
					if (pkgJSON && pkgJSON.name === dep) return pkgJSON;

					const parentDir = path.dirname(dir);
					if (parentDir === dir) break;

					dir = parentDir;
				}
			} catch {
				// Give up! Who knows where the `package.json` is…
			}
		}
	}

	private scanDependencies(deps: string[]): void {
		const newDeps: string[] = [];
		for (const dep of deps) {
			// Attempt: package is common and not Astro. ❌ Skip these for perf
			if (isCommonNotAstro(dep)) {
				this.nonAstroDeps.add(dep);
				continue;
			}

			const pkgJson = this.resolvePkgJSON(dep);
			if (!pkgJson) {
				this.nonAstroDeps.add(dep);
				continue;
			}
			const { dependencies = {}, peerDependencies = {}, keywords = [] } = pkgJson;

			if (
				// Attempt: package relies on `astro`. ✅ Definitely an Astro package
				peerDependencies.astro ||
				dependencies.astro ||
				// Attempt: package is tagged with `astro` or `astro-component`. ✅ Likely a community package
				keywords.includes('astro') ||
				keywords.includes('astro-component') ||
				// Attempt: package is named `astro-something` or `@scope/astro-something`. ✅ Likely a community package
				/^(@[^\/]+\/)?astro\-/.test(dep)
			) {
				this.astroDeps.add(dep);
				// Collect any dependencies of this Astro package we haven’t seen yet.
				const unknownDependencies = Object.keys(dependencies).filter((d) => !this.seen(d));
				newDeps.push(...unknownDependencies);
			} else {
				this.nonAstroDeps.add(dep);
			}
		}
		if (newDeps.length) this.scanDependencies(newDeps);
	}
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
