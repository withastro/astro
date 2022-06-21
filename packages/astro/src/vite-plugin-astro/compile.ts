import type { TransformResult } from '@astrojs/compiler';
import type { PluginContext, SourceMapInput } from 'rollup';
import type { AstroConfig } from '../@types/astro';
import type { TransformHook } from './styles';

import { transform } from '@astrojs/compiler';
import { fileURLToPath } from 'url';
import { prependForwardSlash } from '../core/path.js';
import { viteID } from '../core/util.js';
import { transformWithVite } from './styles.js';

type CompilationCache = Map<string, CompileResult>;
type CompileResult = TransformResult & { rawCSSDeps: Set<string> };

/**
 * Note: this is currently needed because Astro is directly using a Vite internal CSS transform. This gives us
 * some nice features out of the box, but at the expense of also running Vite's CSS postprocessing build step,
 * which does some things that we don't like, like resolving/handling `@import` too early. This function pulls
 * out the `@import` tags to be added back later, and then finally handled correctly by Vite.
 *
 * In the future, we should remove this workaround and most likely implement our own Astro style handling without
 * having to hook into Vite's internals.
 */
function createImportPlaceholder(spec: string) {
	// Note: We keep this small so that we can attempt to exactly match the # of characters in the original @import.
	// This keeps sourcemaps accurate (to the best of our ability) at the intermediate step where this appears.
	// ->  `@import '${spec}';`;
	return `/*IMPORT:${spec}*/`;
}
function safelyReplaceImportPlaceholder(code: string) {
	return code.replace(/\/\*IMPORT\:(.*?)\*\//g, `@import '$1';`);
}

const configCache = new WeakMap<AstroConfig, CompilationCache>();

export interface CompileProps {
	config: AstroConfig;
	filename: string;
	moduleId: string;
	source: string;
	ssr: boolean;
	viteTransform: TransformHook;
	pluginContext: PluginContext;
}

async function compile({
	config,
	filename,
	moduleId,
	source,
	ssr,
	viteTransform,
	pluginContext,
}: CompileProps): Promise<CompileResult> {
	const filenameURL = new URL(`file://${filename}`);
	const normalizedID = fileURLToPath(filenameURL);

	let rawCSSDeps = new Set<string>();
	let cssTransformError: Error | undefined;

	// Transform from `.astro` to valid `.ts`
	// use `sourcemap: "both"` so that sourcemap is included in the code
	// result passed to esbuild, but also available in the catch handler.
	const transformResult = await transform(source, {
		// For Windows compat, prepend the module ID with `/@fs`
		pathname: `/@fs${prependForwardSlash(moduleId)}`,
		projectRoot: config.root.toString(),
		site: config.site
			? new URL(config.base, config.site).toString()
			: `http://localhost:${config.server.port}/`,
		sourcefile: filename,
		sourcemap: 'both',
		internalURL: `/@fs${prependForwardSlash(
			viteID(new URL('../runtime/server/index.js', import.meta.url))
		)}`,
		// TODO: baseline flag
		experimentalStaticExtraction: true,
		preprocessStyle: async (value: string, attrs: Record<string, string>) => {
			const lang = `.${attrs?.lang || 'css'}`.toLowerCase();

			try {
				// In the static build, grab any @import as CSS dependencies for HMR.
				value.replace(
					/(?:@import)\s(?:url\()?\s?["\'](.*?)["\']\s?\)?(?:[^;]*);?/gi,
					(match, spec) => {
						rawCSSDeps.add(spec);
						// If the language is CSS: prevent `@import` inlining to prevent scoping of imports.
						// Otherwise: Sass, etc. need to see imports for variables, so leave in for their compiler to handle.
						if (lang === '.css') {
							return createImportPlaceholder(spec);
						} else {
							return match;
						}
					}
				);

				const result = await transformWithVite({
					value,
					lang,
					id: normalizedID,
					transformHook: viteTransform,
					ssr,
					pluginContext,
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
				const code = safelyReplaceImportPlaceholder(result.code);
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

	const compileResult: CompileResult = Object.create(transformResult, {
		rawCSSDeps: {
			value: rawCSSDeps,
		},
	});

	return compileResult;
}

export function isCached(config: AstroConfig, filename: string) {
	return configCache.has(config) && configCache.get(config)!.has(filename);
}

export function invalidateCompilation(config: AstroConfig, filename: string) {
	if (configCache.has(config)) {
		const cache = configCache.get(config)!;
		cache.delete(filename);
	}
}

export async function cachedCompilation(props: CompileProps): Promise<CompileResult> {
	const { config, filename } = props;
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
	const compileResult = await compile(props);
	cache.set(filename, compileResult);
	return compileResult;
}
