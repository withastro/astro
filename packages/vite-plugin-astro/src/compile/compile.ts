import {
	preprocessStyles,
	transform,
	type TransformOptions,
	type TransformResult,
} from '@astrojs/compiler-rs';
import type { ResolvedConfig } from 'vite';
import { normalizePath, resolvePath } from '@astrojs/internal-helpers/vite';
import { createStylePreprocessor, type PartialCompileCssResult } from './style.js';
import type { CompileCssResult } from './types.js';
import type { CSSError, ErrorHandler } from '../types.js';

export interface CompileProps
	extends Pick<TransformOptions, 'compact' | 'astroGlobalArgs' | 'scopedStyleStrategy'> {
	viteConfig: ResolvedConfig;
	annotateSourceFile: boolean;
	filename: string;
	source: string;
	handleError: ErrorHandler;
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
	handleError,
}: CompileProps): Promise<CompileResult> {
	const cssPartialCompileResults: PartialCompileCssResult[] = [];
	const cssTransformErrors: CSSError[] = [];
	let transformResult: TransformResult;

	try {
		const preprocessedStyles = await preprocessStyles(
			source,
			createStylePreprocessor({
				filename,
				viteConfig,
				cssPartialCompileResults,
				cssTransformErrors,
				handleError,
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
		throw handleError({
			type: 'compiler',
			message: err.message ?? 'Unknown compiler error',
			stack: err.stack,
			name: undefined,
			hint: undefined,
			frame: undefined,
			title: undefined,
			location: {
				file: filename,
				line: undefined,
				column: undefined,
			},
		});
	}

	handleCompileResultErrors(filename, transformResult, cssTransformErrors, handleError);

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
	cssTransformErrors: CSSError[],
	handleError: ErrorHandler,
) {
	const compilerError = result.diagnostics.find((diag) => diag.severity === 'error');

	if (compilerError) {
		throw handleError({
			type: 'compiler',
			name: 'CompilerError',
			message: compilerError.text,
			hint: compilerError.hint,
			stack: undefined,
			frame: undefined,
			title: 'Compiler Error',
			location: {
				file: filename,
				line: compilerError.labels[0].line,
				column: compilerError.labels[0].column,
			},
		});
	}

	switch (cssTransformErrors.length) {
		case 0:
			break;
		case 1: {
			throw handleError(cssTransformErrors[0]);
		}
		default: {
			throw handleError({
				type: 'aggregate',
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
