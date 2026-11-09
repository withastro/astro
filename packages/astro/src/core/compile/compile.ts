import { fileURLToPath } from 'node:url';
import {
	preprocessStyles,
	transform,
	type TransformOptions,
	type TransformResult,
} from '@astrojs/compiler-rs';
import type { ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../types/public/config.js';
import type { AstroError } from '../errors/errors.js';
import { AggregateError, CompilerError } from '../errors/errors.js';
import { AstroErrorData } from '../errors/index.js';
import { normalizePath, resolvePath } from '../viteUtils.js';
import { createStylePreprocessor, type PartialCompileCssResult } from './style.js';
import type { CompileCssResult } from './types.js';

export interface CompileProps {
	astroConfig: AstroConfig;
	viteConfig: ResolvedConfig;
	toolbarEnabled: boolean;
	filename: string;
	source: string;
	inlineComponentAssets?: boolean;
}

export interface CompileResult extends Omit<TransformResult, 'css'> {
	css: CompileCssResult[];
}

export async function compile({
	astroConfig,
	viteConfig,
	toolbarEnabled,
	filename,
	source,
	inlineComponentAssets,
}: CompileProps): Promise<CompileResult> {
	const cssPartialCompileResults: PartialCompileCssResult[] = [];
	const cssTransformErrors: AstroError[] = [];
	let transformResult: TransformResult;

	// In builds, the compiler emits the filename as string literals (the component
	// `moduleId`, `createMetadata` argument, and script/style ids) that are looked up in
	// the manifest, whose keys are stored relative to the project root. Passing a
	// root-relative filename makes those literals match, while leaving user-authored
	// strings untouched. The `file` and `url` exports and the component `resolvedPath`
	// metadata stay absolute: the former is a public value, the latter keys runtime
	// lookups against the build module graph.
	const isBuild = viteConfig.command === 'build';
	const emittedFilename = isBuild ? normalizeFilename(filename, astroConfig.root) : filename;

	try {
		const preprocessedStyles = await preprocessStyles(
			source,
			createStylePreprocessor({
				filename,
				viteConfig,
				astroConfig,
				cssPartialCompileResults,
				cssTransformErrors,
			}),
		);

		const transformOptions: TransformOptions & { inlineComponentAssets?: boolean } = {
			compact: astroConfig.compressHTML,
			filename: emittedFilename,
			inlineComponentAssets,
			normalizedFilename: normalizeFilename(filename, astroConfig.root),
			sourcemap: 'both',
			internalURL: 'astro/compiler-runtime',
			// TODO: remove in Astro v8
			astroGlobalArgs: JSON.stringify(astroConfig.site),
			scopedStyleStrategy: astroConfig.scopedStyleStrategy,
			resultScopedSlot: true,
			transitionsAnimationURL: 'astro/components/viewtransitions.css',
			// Source annotations only serve the dev toolbar. Vitest also runs Vite in `serve`,
			// so skip them in `test` mode to keep rendered markup (e.g. from the Container API)
			// free of machine-specific paths. See https://github.com/withastro/astro/issues/18162
			annotateSourceFile:
				viteConfig.command === 'serve' &&
				viteConfig.mode !== 'test' &&
				astroConfig.devToolbar &&
				astroConfig.devToolbar.enabled &&
				toolbarEnabled,
			preprocessedStyles,
			resolvePath(specifier) {
				return resolvePath(specifier, filename);
			},
		};
		transformResult = transform(source, transformOptions);
	} catch (err: any) {
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
	}

	handleCompileResultErrors(filename, transformResult, cssTransformErrors);

	return {
		...transformResult,
		css: transformResult.css.map((code, i) => ({
			...cssPartialCompileResults[i],
			code,
		})),
	};
}

function handleCompileResultErrors(
	filename: string,
	result: TransformResult,
	cssTransformErrors: AstroError[],
) {
	const compilerError = result.diagnostics.find((diag) => diag.severity === 'error');

	if (compilerError) {
		throw new CompilerError({
			name: 'CompilerError',
			message: compilerError.text,
			location: {
				line: compilerError.labels[0].line,
				column: compilerError.labels[0].column,
				file: filename,
			},
			hint: compilerError.hint,
		});
	}

	switch (cssTransformErrors.length) {
		case 0:
			break;
		case 1: {
			throw cssTransformErrors[0];
		}
		default: {
			throw new AggregateError({
				...cssTransformErrors[0],
				errors: cssTransformErrors,
			});
		}
	}
}

function normalizeFilename(filename: string, root: URL) {
	const normalizedFilename = normalizePath(filename);
	const normalizedRoot = normalizePath(fileURLToPath(root));
	if (normalizedFilename.startsWith(normalizedRoot)) {
		return normalizedFilename.slice(normalizedRoot.length - 1);
	} else {
		return normalizedFilename;
	}
}
