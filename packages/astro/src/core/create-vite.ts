import type { AstroConfig } from '../@types/astro';
import type { LogOptions } from './logger';

import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
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

// note: ssr is still an experimental API hence the type omission
export type ViteConfigWithSSR = vite.InlineConfig & { ssr?: { external?: string[]; noExternal?: string[] } };

interface CreateViteOptions {
	astroConfig: AstroConfig;
	logging: LogOptions;
	mode: 'dev' | 'build';
}

/** Return a common starting point for all Vite actions */
export async function createVite(inlineConfig: ViteConfigWithSSR, { astroConfig, logging, mode }: CreateViteOptions): Promise<ViteConfigWithSSR> {
	// First, start with the Vite configuration that Astro core needs
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
			noExternal: [...ALWAYS_NOEXTERNAL],
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
				viteConfig = vite.mergeConfig(viteConfig, rendererConfig) as vite.InlineConfig;
			}
		} catch (err) {
			throw new Error(`${name}: ${err}`);
		}
	}

	viteConfig = vite.mergeConfig(viteConfig, inlineConfig); // merge in inline Vite config
	return viteConfig;
}
