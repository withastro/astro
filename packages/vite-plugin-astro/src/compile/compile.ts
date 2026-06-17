import {
	preprocessStyles,
	transform,
	type TransformOptions,
	type TransformResult,
} from '@astrojs/compiler-rs';
import type { ResolvedConfig } from 'vite';
import { AggregateError, CompilerError, ErrorData } from '../errors.js';
import { normalizePath, resolvePath } from '@astrojs/internal-helpers/vite';
import { createStylePreprocessor, type PartialCompileCssResult } from './style.js';
import type { CompileCssResult } from './types.js';

export interface CompileProps
	extends Pick<TransformOptions, 'compact' | 'astroGlobalArgs' | 'scopedStyleStrategy'> {
	viteConfig: ResolvedConfig;
	annotateSourceFile: boolean;
	filename: string;
	source: string;
}

export interface CompileResult extends Omit<TransformResult, 'css'> {
	css: CompileCssResult[];
}

export async function compile({
	viteConfig,
	annotateSourceFile,
	filename,
	source,
	compact,
	astroGlobalArgs,
	scopedStyleStrategy,
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
				cssPartialCompileResults,
				cssTransformErrors,
			}),
		);

		// TODO: what to expose
		transformResult = transform(source, {
			compact,
			filename,
			normalizedFilename: normalizeFilename(filename, viteConfig.root),
			sourcemap: 'both',
			internalURL: 'astro/compiler-runtime',
			// TODO: remove in Astro v7
			astroGlobalArgs,
			scopedStyleStrategy,
			resultScopedSlot: true,
			transitionsAnimationURL: 'astro/components/viewtransitions.css',
			annotateSourceFile: viteConfig.command === 'serve' && annotateSourceFile,
			preprocessedStyles,
			resolvePath(specifier) {
				return resolvePath(specifier, filename);
			},
		});
	} catch (err: any) {
		// The compiler should be able to handle errors by itself, however
		// for the rare cases where it can't let's directly throw here with as much info as possible
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

function normalizeFilename(filename: string, root: string) {
	const normalizedFilename = normalizePath(filename);
	const normalizedRoot = normalizePath(root);
	if (normalizedFilename.startsWith(normalizedRoot)) {
		return normalizedFilename.slice(normalizedRoot.length - 1);
	} else {
		return normalizedFilename;
	}
}
