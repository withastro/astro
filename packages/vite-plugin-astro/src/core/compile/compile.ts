import { fileURLToPath } from 'node:url';
import {
	preprocessStyles,
	transform,
	type TransformOptions,
	type TransformResult,
} from '@astrojs/compiler-rs';
import type { ResolvedConfig } from 'vite';
import type { AstroError } from '@astrojs/runtime/internal/core/errors/errors.js';
import { AggregateError, CompilerError } from '@astrojs/runtime/internal/core/errors/errors.js';
import { AstroErrorData } from '@astrojs/runtime/internal/core/errors/index.js';
import { resolvePath } from '@astrojs/internal-helpers/mdx';
import { normalizePath } from '../vite-id.js';
import { createStylePreprocessor, type PartialCompileCssResult } from './style.js';
import type { CompileCssResult } from './types.js';

/**
 * The project configuration the compiler reads. `AstroConfig` satisfies it.
 */
export interface CompileConfig {
	root: URL;
	site?: string;
	base: string;
	compressHTML: boolean | 'jsx';
	scopedStyleStrategy: 'where' | 'class' | 'attribute';
	devToolbar: { enabled: boolean };
}

export interface CompileProps {
	astroConfig: CompileConfig;
	viteConfig: ResolvedConfig;
	toolbarEnabled: boolean;
	filename: string;
	source: string;
	inlineComponentAssets?: boolean;
	/**
	 * Module that compiled components import their runtime from.
	 *
	 * @default '@astrojs/vite-plugin-astro/compiler-runtime'
	 */
	internalURL?: string;
	/**
	 * Stylesheet imported by components that use built-in `transition:animate` animations.
	 *
	 * @default '@astrojs/vite-plugin-astro/components/viewtransitions.css'
	 */
	transitionsAnimationURL?: string;
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
	internalURL = '@astrojs/vite-plugin-astro/compiler-runtime',
	transitionsAnimationURL = '@astrojs/vite-plugin-astro/components/viewtransitions.css',
}: CompileProps): Promise<CompileResult> {
	const cssPartialCompileResults: PartialCompileCssResult[] = [];
	const cssTransformErrors: AstroError[] = [];
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

		const transformOptions: TransformOptions & { inlineComponentAssets?: boolean } = {
			compact: astroConfig.compressHTML,
			filename,
			inlineComponentAssets,
			normalizedFilename: normalizeFilename(filename, astroConfig.root),
			sourcemap: 'both',
			internalURL,
			// TODO: remove in Astro v8
			astroGlobalArgs: JSON.stringify(astroConfig.site),
			scopedStyleStrategy: astroConfig.scopedStyleStrategy,
			resultScopedSlot: true,
			transitionsAnimationURL,
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
