import type { TransformResult } from '@astrojs/compiler';
import type { AstroConfig } from '../../@types/astro';
import type { TransformStyle } from './types';

import { transform } from '@astrojs/compiler';
import { AstroErrorCodes } from '../errors.js';
import { prependForwardSlash } from '../path.js';
import { AggregateError, viteID } from '../util.js';
import { createStylePreprocessor } from './style.js';

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
	transformStyle: TransformStyle;
}

async function compile({
	config,
	filename,
	moduleId,
	source,
	transformStyle,
}: CompileProps): Promise<CompileResult> {
	let cssDeps = new Set<string>();
	let cssTransformErrors: Error[] = [];

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
			viteID(new URL('../../runtime/server/index.js', import.meta.url))
		)}`,
		// TODO: baseline flag
		experimentalStaticExtraction: true,
		preprocessStyle: createStylePreprocessor(transformStyle, cssDeps, cssTransformErrors),
	})
		.catch((err) => {
			// throw compiler errors here if encountered
			err.code = err.code || AstroErrorCodes.UnknownCompilerError;
			throw err;
		})
		.then((result) => {
			switch (cssTransformErrors.length) {
				case 0:
					return result;
				case 1: {
					let error = cssTransformErrors[0];
					if (!(error as any).code) {
						(error as any).code = AstroErrorCodes.UnknownCompilerCSSError;
					}
					throw cssTransformErrors[0];
				}
				default: {
					const aggregateError = new AggregateError(cssTransformErrors);
					(aggregateError as any).code = AstroErrorCodes.UnknownCompilerCSSError;
					throw aggregateError;
				}
			}
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
