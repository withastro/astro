import { preprocessStyles, transform, type TransformResult } from '@astrojs/compiler-rs';
import type { ResolvedConfig } from 'vite';
import { normalizePath, resolvePath } from '@astrojs/internal-helpers/vite';
import { createStylePreprocessor, type PartialCompileCssResult } from './style.js';
import type { CompileCssResult } from './types.js';
import type { CSSError, ErrorHandler, ExposedTransformOptions } from '../types.js';

export interface CompileProps {
	viteConfig: ResolvedConfig;
	filename: string;
	source: string;
	handleError: ErrorHandler;
	transformOptions: ExposedTransformOptions;
}

export interface CompileResult extends Omit<TransformResult, 'css'> {
	css: CompileCssResult[];
}

export async function compile({
	viteConfig,
	filename,
	source,
	handleError,
	transformOptions,
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

		transformResult = transform(source, {
			...transformOptions,
			filename,
			normalizedFilename: normalizeFilename(filename, viteConfig.root),
			annotateSourceFile: viteConfig.command === 'serve' && transformOptions.annotateSourceFile,
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
			throw cssTransformErrors[0];
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
