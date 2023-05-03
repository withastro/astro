import type { TransformResult } from '@astrojs/compiler';
import type { ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../@types/astro';

import { transform } from '@astrojs/compiler';
import { fileURLToPath } from 'url';
import { normalizePath } from 'vite';
import { AggregateError, AstroError, CompilerError } from '../errors/errors.js';
import { AstroErrorData } from '../errors/index.js';
import { resolvePath } from '../util.js';
import { createStylePreprocessor } from './style.js';

export interface CompileProps {
	astroConfig: AstroConfig;
	viteConfig: ResolvedConfig;
	filename: string;
	source: string;
}

export interface CompileResult extends TransformResult {
	cssDeps: Set<string>;
	source: string;
}

export async function compile({
	astroConfig,
	viteConfig,
	filename,
	source,
}: CompileProps): Promise<CompileResult> {
	const cssDeps = new Set<string>();
	const cssTransformErrors: AstroError[] = [];
	let transformResult: TransformResult;

	try {
		// Transform from `.astro` to valid `.ts`
		// use `sourcemap: "both"` so that sourcemap is included in the code
		// result passed to esbuild, but also available in the catch handler.
		transformResult = await transform(source, {
			filename,
			normalizedFilename: normalizeFilename(filename, astroConfig.root),
			sourcemap: 'both',
			internalURL: 'astro/server/index.js',
			astroGlobalArgs: JSON.stringify(astroConfig.site),
			scopedStyleStrategy: astroConfig.scopedStyleStrategy,
			resultScopedSlot: true,
			preprocessStyle: createStylePreprocessor({
				filename,
				viteConfig,
				cssDeps,
				cssTransformErrors,
			}),
			async resolvePath(specifier) {
				return resolvePath(specifier, filename);
			},
		});
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

	handleCompileResultErrors(transformResult, cssTransformErrors);

	return {
		...transformResult,
		cssDeps,
		source,
	};
}

function handleCompileResultErrors(result: TransformResult, cssTransformErrors: AstroError[]) {
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
			break;
		case 1: {
			const error = cssTransformErrors[0];
			if (!error.errorCode) {
				error.errorCode = AstroErrorData.UnknownCSSError.code;
			}
			throw cssTransformErrors[0];
		}
		default: {
			throw new AggregateError({
				...cssTransformErrors[0],
				code: cssTransformErrors[0].errorCode,
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
