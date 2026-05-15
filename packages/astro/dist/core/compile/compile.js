import { fileURLToPath } from 'node:url';
import { transform } from '@astrojs/compiler';
import { AggregateError, CompilerError } from '../errors/errors.js';
import { AstroErrorData } from '../errors/index.js';
import { normalizePath, resolvePath } from '../viteUtils.js';
import { createStylePreprocessor } from './style.js';
async function compile({ astroConfig, viteConfig, toolbarEnabled, filename, source }) {
	const cssPartialCompileResults = [];
	const cssTransformErrors = [];
	let transformResult;
	try {
		transformResult = await transform(source, {
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
			preprocessStyle: createStylePreprocessor({
				filename,
				viteConfig,
				astroConfig,
				cssPartialCompileResults,
				cssTransformErrors,
			}),
			async resolvePath(specifier) {
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
	handleCompileResultErrors(transformResult, cssTransformErrors);
	return {
		...transformResult,
		css: transformResult.css.map((code, i) => ({
			...cssPartialCompileResults[i],
			code,
		})),
	};
}
function handleCompileResultErrors(result, cssTransformErrors) {
	const compilerError = result.diagnostics.find((diag) => diag.severity === 1);
	if (compilerError) {
		throw new CompilerError({
			name: 'CompilerError',
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
