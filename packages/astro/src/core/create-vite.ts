import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from './logger';

import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as vite from 'vite';
import astroVitePlugin from '../vite-plugin-astro/index.js';
import astroViteServerPlugin from '../vite-plugin-astro-server/index.js';
import astroPostprocessVitePlugin from '../vite-plugin-astro-postprocess/index.js';
import configAliasVitePlugin from '../vite-plugin-config-alias/index.js';
import markdownVitePlugin from '../vite-plugin-markdown/index.js';
import jsxVitePlugin from '../vite-plugin-jsx/index.js';
import envVitePlugin from '../vite-plugin-env/index.js';
import { resolveDependency } from './util.js';

// Some packages are just external, and that’s the way it goes.
const ALWAYS_EXTERNAL = new Set([
	...builtinModules.map((name) => `node:${name}`),
	'@sveltejs/vite-plugin-svelte',
	'micromark-util-events-to-acorn',
	'serialize-javascript',
	'node-fetch',
	'prismjs',
	'shiki',
	'shorthash',
	'unified',
	'whatwg-url',
]);
const ALWAYS_NOEXTERNAL = new Set([
	'astro', // This is only because Vite's native ESM doesn't resolve "exports" correctly.
]);

// note: ssr is still an experimental API hence the type omission from `vite`
export type ViteConfigWithSSR = vite.InlineConfig & { ssr?: vite.SSROptions };

interface CreateViteOptions {
	astroConfig: AstroConfig;
	logging: LogOptions;
	mode: 'dev' | 'build';
}

/** Return a common starting point for all Vite actions */
export async function createVite(inlineConfig: ViteConfigWithSSR, { astroConfig, logging, mode }: CreateViteOptions): Promise<ViteConfigWithSSR> {
	// Scan for any third-party Astro packages. Vite needs these to be passed to `ssr.noExternal`.
	const astroPackages = await getAstroPackages(astroConfig);

	// Start with the Vite configuration that Astro core needs
	let viteConfig: ViteConfigWithSSR = {
		cacheDir: fileURLToPath(new URL('./node_modules/.vite/', astroConfig.projectRoot)), // using local caches allows Astro to be used in monorepos, etc.
		clearScreen: false, // we want to control the output, not Vite
		logLevel: 'error', // log errors only
		optimizeDeps: {
			entries: ['src/**/*'], // Try and scan a user’s project (won’t catch everything),
		},
		plugins: [
			configAliasVitePlugin({ config: astroConfig }),
			astroVitePlugin({ config: astroConfig, logging }),
			// The server plugin is for dev only and having it run during the build causes
			// the build to run very slow as the filewatcher is triggered often.
			mode === 'dev' && astroViteServerPlugin({ config: astroConfig, logging }),
			envVitePlugin({ config: astroConfig }),
			markdownVitePlugin({ config: astroConfig }),
			jsxVitePlugin({ config: astroConfig, logging }),
			astroPostprocessVitePlugin({ config: astroConfig }),
		],
		publicDir: fileURLToPath(astroConfig.public),
		root: fileURLToPath(astroConfig.projectRoot),
		envPrefix: 'PUBLIC_',
		server: {
			force: true, // force dependency rebuild (TODO: enabled only while next is unstable; eventually only call in "production" mode?)
			hmr: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production' ? false : undefined, // disable HMR for test
			// handle Vite URLs
			proxy: {
				// add proxies here
			},
		},
		// Note: SSR API is in beta (https://vitejs.dev/guide/ssr.html)
		ssr: {
			external: [...ALWAYS_EXTERNAL],
			noExternal: [...ALWAYS_NOEXTERNAL, ...astroPackages],
		},
	};

	// Add in Astro renderers, which will extend the base config
	for (const name of astroConfig.renderers) {
		try {
			const { default: renderer } = await import(resolveDependency(name, astroConfig));
			if (!renderer) continue;
			// if a renderer provides viteConfig(), call it and pass in results
			if (renderer.viteConfig) {
				if (typeof renderer.viteConfig !== 'function') {
					throw new Error(`${name}: viteConfig(options) must be a function! Got ${typeof renderer.viteConfig}.`);
				}
				const rendererConfig = await renderer.viteConfig({ mode: inlineConfig.mode, command: inlineConfig.mode === 'production' ? 'build' : 'serve' }); // is this command true?
				viteConfig = vite.mergeConfig(viteConfig, rendererConfig) as ViteConfigWithSSR;
			}
		} catch (err) {
			throw new Error(`${name}: ${err}`);
		}
	}

	viteConfig = vite.mergeConfig(viteConfig, inlineConfig); // merge in inline Vite config
	return viteConfig;
}

// Scans `projectRoot` for third-party Astro packages that could export an `.astro` file
// `.astro` files need to be built by Vite, so these should use `noExternal`
async function getAstroPackages({ projectRoot }: AstroConfig): Promise<string[]> {
	const pkgUrl = new URL('./package.json', projectRoot);
	const pkgPath = fileURLToPath(pkgUrl);
	if (!fs.existsSync(pkgPath)) return [];

	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	const deps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

	return deps.filter((dep) => {
		// Attempt: package is common and not Astro. ❌ Skip these for perf
		if (isCommonNotAstro(dep)) return false;
		// Attempt: package is named `astro-something`. ✅ Likely a community package
		if (/^astro\-/.test(dep)) return true;
		const depPkgUrl = new URL(`./node_modules/${dep}/package.json`, projectRoot);
		const depPkgPath = fileURLToPath(depPkgUrl);
		if (!fs.existsSync(depPkgPath)) return false;

		const { dependencies = {}, peerDependencies = {}, keywords = [] } = JSON.parse(fs.readFileSync(depPkgPath, 'utf-8'));
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
			(prefix) => (prefix.startsWith('@') ? dep.startsWith(prefix) : dep.substring(dep.lastIndexOf('/') + 1).startsWith(prefix)) // check prefix omitting @scope/
		)
	);
}
