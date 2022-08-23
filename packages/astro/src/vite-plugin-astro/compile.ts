import type { TransformResult } from '@astrojs/compiler';
import type { PluginContext, SourceMapInput } from 'rollup';
import type { ViteDevServer } from 'vite';
import type { AstroConfig } from '../@types/astro';
import type { TransformStyleWithVite } from './styles';

import { transform } from '@astrojs/compiler';
import { fileURLToPath } from 'url';
import { AstroErrorCodes } from '../core/errors.js';
import { prependForwardSlash } from '../core/path.js';
import { viteID } from '../core/util.js';

type CompilationCache = Map<string, CompileResult>;
type CompileResult = TransformResult & {
	cssDeps: Set<string>;
	source: string;
};

const configCache = new WeakMap<AstroConfig, CompilationCache>();

export interface CompileProps {
	config: AstroConfig;
	filename: string;
	moduleId: string;
	source: string;
	ssr: boolean;
	transformStyleWithVite: TransformStyleWithVite;
	viteDevServer?: ViteDevServer;
	pluginContext: PluginContext;
}

function getNormalizedID(filename: string): string {
	try {
		const filenameURL = new URL(`file://${filename}`);
		return fileURLToPath(filenameURL);
	} catch (err) {
		// Not a real file, so just use the provided filename as the normalized id
		return filename;
	}
}

async function compile({
	config,
	filename,
	moduleId,
	source,
	ssr,
	transformStyleWithVite,
	viteDevServer,
	pluginContext,
}: CompileProps): Promise<CompileResult> {
	const normalizedID = getNormalizedID(filename);
	let cssDeps = new Set<string>();
	let cssTransformError: Error | undefined;

	// handleHotUpdate doesn't have `addWatchFile` used by transformStyleWithVite.
	if (!pluginContext.addWatchFile) {
		pluginContext.addWatchFile = () => {};
	}

	// Transform from `.astro` to valid `.ts`
	// use `sourcemap: "both"` so that sourcemap is included in the code
	// result passed to esbuild, but also available in the catch handler.
	const transformResult = await transform(source, {
		// For Windows compat, prepend the module ID with `/@fs`
		pathname: `/@fs${prependForwardSlash(moduleId)}`,
		projectRoot: config.root.toString(),
		site: config.site?.toString(),
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
				const result = await transformStyleWithVite.call(pluginContext, {
					id: normalizedID,
					source: value,
					lang,
					ssr,
					viteDevServer,
				});

				if (!result) return null as any; // TODO: add type in compiler to fix "any"

				for (const dep of result.deps) {
					cssDeps.add(dep);
				}

				let map: SourceMapInput | undefined;
				if (result.map) {
					if (typeof result.map === 'string') {
						map = result.map;
					} else if (result.map.mappings) {
						map = result.map.toString();
					}
				}

				return { code: result.code, map };
			} catch (err) {
				// save error to throw in plugin context
				cssTransformError = err as any;
				return null;
			}
		},
	})
		.catch((err) => {
			// throw compiler errors here if encountered
			err.code = err.code || AstroErrorCodes.UnknownCompilerError;
			throw err;
		})
		.then((result) => {
			// throw CSS transform errors here if encountered
			if (cssTransformError) {
				(cssTransformError as any).code =
					(cssTransformError as any).code || AstroErrorCodes.UnknownCompilerCSSError;
				throw cssTransformError;
			}
			return result;
		});

	const compileResult: CompileResult = Object.create(transformResult, {
		cssDeps: {
			value: cssDeps,
		},
		source: {
			value: source,
		},
	});

	return compileResult;
}

export function isCached(config: AstroConfig, filename: string) {
	return configCache.has(config) && configCache.get(config)!.has(filename);
}

export function getCachedSource(config: AstroConfig, filename: string): string | null {
	if (!isCached(config, filename)) return null;
	let src = configCache.get(config)!.get(filename);
	if (!src) return null;
	return src.source;
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
