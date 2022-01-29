import type { AstroConfig } from '../@types/astro';
import type { TransformResult } from '@astrojs/compiler';
import type { SourceMapInput } from 'rollup';
import type { TransformHook } from './styles';

import fs from 'fs';
import { fileURLToPath } from 'url';
import { transform } from '@astrojs/compiler';
import { transformWithVite } from './styles.js';

type CompilationCache = Map<string, TransformResult>;

const configCache = new WeakMap<AstroConfig, CompilationCache>();

// https://github.com/vitejs/vite/discussions/5109#discussioncomment-1450726
function isSSR(options: undefined | boolean | { ssr: boolean }): boolean {
	if (options === undefined) {
		return false;
	}
	if (typeof options === 'boolean') {
		return options;
	}
	if (typeof options == 'object') {
		return !!options.ssr;
	}
	return false;
}

async function compile(config: AstroConfig, filename: string, source: string, viteTransform: TransformHook, opts: boolean | undefined) {
	// pages and layouts should be transformed as full documents (implicit <head> <body> etc)
	// everything else is treated as a fragment
	const filenameURL = new URL(`file://${filename}`);
	const normalizedID = fileURLToPath(filenameURL);
	const isPage = normalizedID.startsWith(fileURLToPath(config.pages)) || normalizedID.startsWith(fileURLToPath(config.layouts));
	const pathname = filenameURL.pathname.substr(config.projectRoot.pathname.length - 1);

	let cssTransformError: Error | undefined;

	// Transform from `.astro` to valid `.ts`
	// use `sourcemap: "both"` so that sourcemap is included in the code
	// result passed to esbuild, but also available in the catch handler.
	const transformResult = await transform(source, {
		as: isPage ? 'document' : 'fragment',
		pathname,
		projectRoot: config.projectRoot.toString(),
		site: config.buildOptions.site,
		sourcefile: filename,
		sourcemap: 'both',
		internalURL: 'astro/internal',
		experimentalStaticExtraction: config.buildOptions.experimentalStaticBuild,
		// TODO add experimental flag here
		preprocessStyle: async (value: string, attrs: Record<string, string>) => {
			const lang = `.${attrs?.lang || 'css'}`.toLowerCase();
			try {
				let prefix = '';
				// In the static build, strip away at-imports so that they can be resolved
				// by the pseudo-module that gets created.
				if (config.buildOptions.experimentalStaticBuild) {
					value = value.replace(/(?:@import)\s(?:url\()?\s?["\'](.*?)["\']\s?\)?(?:[^;]*);?/gi, (match) => {
						prefix += match;
						// Replace with an empty string of the same length, to preserve source maps.
						return new Array(match.length).fill(' ').join('');
					});
				}
				const result = await transformWithVite({
					value,
					lang,
					id: filename,
					transformHook: viteTransform,
					ssr: isSSR(opts),
				});

				let map: SourceMapInput | undefined;
				if (!result) return null as any; // TODO: add type in compiler to fix "any"
				if (result.map) {
					if (typeof result.map === 'string') {
						map = result.map;
					} else if (result.map.mappings) {
						map = result.map.toString();
					}
				}
				const code = (prefix += result.code);
				return { code, map };
			} catch (err) {
				// save error to throw in plugin context
				cssTransformError = err as any;
				return null;
			}
		},
	});

	// throw CSS transform errors here if encountered
	if (cssTransformError) throw cssTransformError;

	return transformResult;
}

export function invalidateCompilation(config: AstroConfig, filename: string) {
	if (configCache.has(config)) {
		const cache = configCache.get(config)!;
		cache.delete(filename);
	}
}

export async function cachedCompilation(config: AstroConfig, filename: string, source: string | null, viteTransform: TransformHook, opts: boolean | undefined) {
	let cache: CompilationCache;
	if (!configCache.has(config)) {
		cache = new Map();
		configCache.set(config, cache);
	} else {
		cache = configCache.get(config)!;
	}
	if (cache.has(filename)) {
		return cache.get(filename)!;
	}

	if (source === null) {
		const fileUrl = new URL(`file://${filename}`);
		source = await fs.promises.readFile(fileUrl, 'utf-8');
	}
	const transformResult = await compile(config, filename, source, viteTransform, opts);
	cache.set(filename, transformResult);
	return transformResult;
}
