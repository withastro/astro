import type { TransformResult } from '@astrojs/compiler';
import path from 'path';
import type { ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../@types/astro';

import { transform } from '@astrojs/compiler';
import { preprocessCSS } from 'vite';
import { AstroErrorCodes } from '../errors.js';
import { prependForwardSlash, removeLeadingForwardSlashWindows } from '../path.js';
import { AggregateError, resolveJsToTs, viteID } from '../util.js';

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
	let cssTransformErrors: Error[] = [];

	// Transform from `.astro` to valid `.ts`
	// use `sourcemap: "both"` so that sourcemap is included in the code
	// result passed to esbuild, but also available in the catch handler.
	const transformResult = await transform(source, {
		// For Windows compat, prepend filename with `/`.
		// Note this is required because the compiler uses URLs to parse and built paths.
		// TODO: Ideally the compiler could expose a `resolvePath` function so that we can
		// unify how we handle path in a bundler-agnostic way.
		// At the meantime workaround with a slash and  remove them in `astro:postprocess`
		// when they are used in `client:component-path`.
		pathname: prependForwardSlash(filename),
		projectRoot: astroConfig.root.toString(),
		site: astroConfig.site?.toString(),
		sourcefile: filename,
		sourcemap: 'both',
		internalURL: `/@fs${prependForwardSlash(
			viteID(new URL('../../runtime/server/index.js', import.meta.url))
		)}`,
		// TODO: baseline flag
		experimentalStaticExtraction: true,
		async preprocessStyle(content, attrs) {
			const lang = `.${attrs?.lang || 'css'}`.toLowerCase();
			const id = `${filename}?astro&type=style&lang${lang}`;
			try {
				const result = await preprocessCSS(content, id, viteConfig);
				cssDeps = result.deps ?? cssDeps;

				let map: string | undefined;
				if (result.map) {
					if (typeof result.map === 'string') {
						map = result.map;
					} else if (result.map.mappings) {
						map = result.map.toString();
					}
				}

				return { code: result.code, map };
			} catch (e) {
				cssTransformErrors.push(e as Error);
				return { error: e + '' };
			}
		},
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

	// Also fix path before returning. Example original resolvedPaths:
	// - @astrojs/preact/client.js
	// - @/components/Foo.vue
	// - /Users/macos/project/src/Foo.vue
	// - /C:/Windows/project/src/Foo.vue
	for (const c of compileResult.clientOnlyComponents) {
		c.resolvedPath = removeLeadingForwardSlashWindows(c.resolvedPath);
		// The compiler trims .jsx by default, prevent this
		if (c.specifier.endsWith('.jsx') && !c.resolvedPath.endsWith('.jsx')) {
			c.resolvedPath += '.jsx';
		}
		if (path.isAbsolute(c.resolvedPath)) {
			c.resolvedPath = resolveJsToTs(c.resolvedPath);
		}
	}
	for (const c of compileResult.hydratedComponents) {
		c.resolvedPath = removeLeadingForwardSlashWindows(c.resolvedPath);
		// The compiler trims .jsx by default, prevent this
		if (c.specifier.endsWith('.jsx') && !c.resolvedPath.endsWith('.jsx')) {
			c.resolvedPath += '.jsx';
		}
		if (path.isAbsolute(c.resolvedPath)) {
			c.resolvedPath = resolveJsToTs(c.resolvedPath);
		}
	}

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
