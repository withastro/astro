import { fileURLToPath } from 'node:url';
import { preprocessStyles, transform, type TransformResult } from '@astrojs/compiler-rs';
import type { ResolvedConfig } from 'vite';
import type { AstroConfigLike } from '../types.js';
import { AggregateError, CompilerError, ErrorData } from '../errors.js';
import { normalizePath, resolvePath } from '@astrojs/internal-helpers/vite';
import { createStylePreprocessor, type PartialCompileCssResult } from './style.js';
import type { CompileCssResult } from './types.js';

export interface CompileProps {
	astroConfig: AstroConfigLike;
	viteConfig: ResolvedConfig;
	toolbarEnabled: boolean;
	filename: string;
	source: string;
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
}: CompileProps): Promise<CompileResult> {
	const cssPartialCompileResults: PartialCompileCssResult[] = [];
	const cssTransformErrors: CompilerError[] = [];
	let transformResult: TransformResult;

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

		transformResult = transform(source, {
			compact: astroConfig.compressHTML,
			filename,
			normalizedFilename: normalizeFilename(filename, astroConfig.root),
			sourcemap: 'both',
			internalURL: 'astro/compiler-runtime',
			// TODO: remove in Astro v7
			astroGlobalArgs: JSON.stringify(astroConfig.site),
			scopedStyleStrategy: astroConfig.scopedStyleStrategy,
			resultScopedSlot: true,
			transitionsAnimationURL: 'astro/components/viewtransitions.css',
			annotateSourceFile:
				viteConfig.command === 'serve' &&
				astroConfig.devToolbar &&
				astroConfig.devToolbar.enabled &&
				toolbarEnabled,
			preprocessedStyles,
			resolvePath(specifier) {
				return resolvePath(specifier, filename);
			},
		});
	} catch (err: any) {
		throw new CompilerError({
			...ErrorData.UnknownCompilerError,
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
	cssTransformErrors: CompilerError[],
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
