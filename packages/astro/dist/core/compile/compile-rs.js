import { fileURLToPath } from 'node:url';
import { AggregateError, CompilerError } from '../errors/errors.js';
import { AstroErrorData } from '../errors/index.js';
import { normalizePath, resolvePath } from '../viteUtils.js';
import { createStylePreprocessor } from './style.js';
async function compile({ astroConfig, viteConfig, toolbarEnabled, filename, source }) {
	let preprocessStyles;
	let transform;
	try {
		({ preprocessStyles, transform } = await import('@astrojs/compiler-rs'));
	} catch (err) {
		throw new Error(
			`Failed to load @astrojs/compiler-rs. Make sure it is installed and up to date. Original error: ${err}`,
		);
	}
	const cssPartialCompileResults = [];
	const cssTransformErrors = [];
	let transformResult;
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
	} catch (err) {
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
function handleCompileResultErrors(filename, result, cssTransformErrors) {
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
function normalizeFilename(filename, root) {
	const normalizedFilename = normalizePath(filename);
	const normalizedRoot = normalizePath(fileURLToPath(root));
	if (normalizedFilename.startsWith(normalizedRoot)) {
		return normalizedFilename.slice(normalizedRoot.length - 1);
	} else {
		return normalizedFilename;
	}
}
export { compile };
