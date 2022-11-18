import type { TransformResult } from '@astrojs/compiler';
import type { ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../@types/astro';

import { transform } from '@astrojs/compiler';
import { AggregateError, AstroError, CompilerError } from '../errors/errors.js';
import { AstroErrorData } from '../errors/index.js';
import { prependForwardSlash } from '../path.js';
import { resolvePath, viteID } from '../util.js';
import { createStylePreprocessor } from './style.js';

type CompilationCache = Map<string, CompileResult>;
type CompileResult = TransformResult & {
	cssDeps: Set<string>;
	source: string;
};

const configCache = new WeakMap<AstroConfig, CompilationCache>();

export interface CompileProps {
	astroConfig: AstroConfig;
	viteConfig: ResolvedConfig;
	filename: string;
	source: string;
}

async function compile({
	astroConfig,
	viteConfig,
	filename,
	source,
}: CompileProps): Promise<CompileResult> {
	let cssDeps = new Set<string>();
	let cssTransformErrors: AstroError[] = [];

	// Transform from `.astro` to valid `.ts`
	// use `sourcemap: "both"` so that sourcemap is included in the code
	// result passed to esbuild, but also available in the catch handler.
	const transformResult = await transform(source, {
		pathname: filename,
		projectRoot: astroConfig.root.toString(),
		site: astroConfig.site?.toString(),
		sourcefile: filename,
		sourcemap: 'both',
		internalURL: `/@fs${prependForwardSlash(
			viteID(new URL('../../runtime/server/index.js', import.meta.url))
		)}`,
		// TODO: baseline flag
		experimentalStaticExtraction: true,
		preprocessStyle: createStylePreprocessor({
			filename,
			viteConfig,
			cssDeps,
			cssTransformErrors,
		}),
		async resolvePath(specifier) {
			return resolvePath(specifier, filename);
		},
	})
		.catch((err: Error) => {
			// The compiler should be able to handle errors by itself, however
			// for the rare cases where it can't let's directly throw here with as much info as possible
			throw new CompilerError({
				...AstroErrorData.UnknownCompilerError,
				message: err.message ?? 'Unknown compiler error',
				stack: err.stack,
				location: {
					file: filename,
				},
			});
		})
		.then((result) => {
			const compilerError = result.diagnostics.find((diag) => diag.severity === 1);

			if (compilerError) {
				throw new CompilerError({
					code: compilerError.code,
					message: compilerError.text,
					location: {
						line: compilerError.location.line,
						column: compilerError.location.column,
						file: compilerError.location.file,
					},
					hint: compilerError.hint,
				});
			}

			switch (cssTransformErrors.length) {
				case 0:
					return result;
				case 1: {
					let error = cssTransformErrors[0];
					if (!error.code) {
						error.code = AstroErrorData.UnknownCSSError.code;
					}

					throw cssTransformErrors[0];
				}
				default: {
					throw new AggregateError({ ...cssTransformErrors[0], errors: cssTransformErrors });
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
	const { astroConfig, filename } = props;
	let cache: CompilationCache;
	if (!configCache.has(astroConfig)) {
		cache = new Map();
		configCache.set(astroConfig, cache);
	} else {
		cache = configCache.get(astroConfig)!;
	}
	if (cache.has(filename)) {
		return cache.get(filename)!;
	}
	const compileResult = await compile(props);
	cache.set(filename, compileResult);
	return compileResult;
}
