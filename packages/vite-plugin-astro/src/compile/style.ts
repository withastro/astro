import fs from 'node:fs';
import { createRequire } from 'node:module';
import { preprocessCSS, type ResolvedConfig } from 'vite';
import { CSSError, ErrorData, positionAt } from '../errors.js';
import { normalizePath } from '@astrojs/internal-helpers/vite';
import type { CompileCssResult } from './types.js';

export type PartialCompileCssResult = Pick<CompileCssResult, 'isGlobal' | 'dependencies'>;

interface PreprocessorResult {
	code: string;
	map?: string;
}

interface PreprocessorError {
	error: string;
}

export type PreprocessStyleFn = (
	content: string,
	attrs: Record<string, string>,
) => Promise<PreprocessorResult | PreprocessorError>;

/**
 * Rewrites absolute URLs in CSS to include the base path.
 *
 * Vite's `preprocessCSS` function explicitly does NOT resolve URLs in `url()` or `image-set()`
 * (https://vite.dev/guide/api-javascript.html#preprocesscss). During build, Vite's CSS plugin handles URL rewriting through its
 * full transform pipeline, but during dev, Astro calls `preprocessCSS` directly through the
 * compiler, bypassing that pipeline.
 *
 * Only absolute URLs starting with `/` (e.g., `/fonts/font.woff`, `/images/bg.png`) are rewritten
 *
 * Uses Vite's cssUrlRE regex pattern for reliable URL matching.
 * See: https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/css.ts
 *
 * @param css - The CSS string to process
 * @param base - The base path to prepend (e.g., `/my-base`)
 * @returns The CSS with rewritten URLs
 */
function rewriteCssUrls(css: string, base: string): string {
	if (!base || base === '/') {
		return css;
	}

	const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

	if (!normalizedBase.startsWith('/')) {
		return css;
	}

	const cssUrlRE =
		// eslint-disable-next-line regexp/no-unused-capturing-group
		/(?<!@import\s+)(?<=^|[^\w\-\u0080-\uffff])url\((\s*('[^']+'|"[^"]+")\s*|(?:\\.|[^'")\\])+)\)/g;

	return css.replace(cssUrlRE, (match, rawUrl: string) => {
		let url = rawUrl.trim();
		let quote = '';

		if ((url.startsWith("'") && url.endsWith("'")) || (url.startsWith('"') && url.endsWith('"'))) {
			quote = url[0];
			url = url.slice(1, -1);
		}

		url = url.trim();

		const isRootRelative = url.startsWith('/') && !url.startsWith('//');
		const isExternal =
			url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:');
		const alreadyHasBase = url.startsWith(normalizedBase + '/');

		if (isRootRelative && !isExternal && !alreadyHasBase) {
			return `url(${quote}${normalizedBase}${url}${quote})`;
		}

		return match;
	});
}

/**
 * Workaround for https://github.com/withastro/astro/issues/16524.
 *
 * When `vite.css.transformer === 'lightningcss'`, lightningcss flattens nested
 * selectors (e.g. `.parent { :where(& > :not(:last-child)) { ... } }`) BEFORE
 * `@astrojs/compiler` injects scope attributes. The injector then sees a
 * top-level rule whose leading compound is `:where(...)` rather than
 * `.parent`, and falls back to prepending `[data-astro-cid-X]` as a new
 * leading compound, which constrains the wrong element.
 *
 * To preserve the structural shape the scope injector expects, we ask
 * lightningcss to skip its `Nesting` lowering pass for the per-component
 * preprocess call. Vite's downstream pipeline still lowers nesting for the
 * final bundle, so the produced CSS remains compatible with the user's
 * targets.
 *
 * Returns a NEW config object (no mutation of the shared `viteConfig`) so
 * that parallel `.astro` compilations don't race on a shared mutable
 * property. Returns `undefined` if `lightningcss` cannot be resolved from
 * the user's project, in which case the caller falls back to the original
 * config (and Vite's preprocessCSS will surface the misconfiguration).
 */
function withNestingExcluded(viteConfig: ResolvedConfig): ResolvedConfig | undefined {
	let Features: { Nesting: number };
	try {
		const requireFromRoot = createRequire(viteConfig.root + '/');
		Features = (requireFromRoot('lightningcss') as { Features: { Nesting: number } }).Features;
	} catch {
		return undefined;
	}
	const lcss = (viteConfig.css?.lightningcss ?? {}) as { exclude?: number };
	const prevExclude = lcss.exclude ?? 0;
	return {
		...viteConfig,
		css: { ...viteConfig.css, lightningcss: { ...lcss, exclude: prevExclude | Features.Nesting } },
	} as ResolvedConfig;
}

export function createStylePreprocessor({
	filename,
	viteConfig,
	cssPartialCompileResults,
	cssTransformErrors,
}: {
	filename: string;
	viteConfig: ResolvedConfig;
	cssPartialCompileResults: Partial<CompileCssResult>[];
	cssTransformErrors: Error[];
}): PreprocessStyleFn {
	let processedStylesCount = 0;

	return async (content, attrs) => {
		const index = processedStylesCount++;
		const lang = `.${attrs?.lang || 'css'}`.toLowerCase();
		const id = `${filename}?astro&type=style&index=${index}&lang${lang}`;
		try {
			const effectiveViteConfig =
				viteConfig.css?.transformer === 'lightningcss'
					? (withNestingExcluded(viteConfig) ?? viteConfig)
					: viteConfig;
			const result = await preprocessCSS(content, id, effectiveViteConfig);

			const rewrittenCode = rewriteCssUrls(result.code, viteConfig.base);

			cssPartialCompileResults[index] = {
				isGlobal: 'is:global' in attrs,
				dependencies: result.deps ? [...result.deps].map((dep) => normalizePath(dep)) : [],
			};

			let map: string | undefined;
			if (result.map) {
				if (typeof result.map === 'string') {
					map = result.map;
				} else if (result.map.mappings) {
					map = result.map.toString();
				}
			}

			return { code: rewrittenCode, map };
		} catch (err: any) {
			try {
				err = enhanceCSSError(err, filename, content);
			} catch {}
			cssTransformErrors.push(err);
			return { error: err + '' };
		}
	};
}

function enhanceCSSError(err: any, filename: string, cssContent: string) {
	const fileContent = fs.readFileSync(filename).toString();
	const styleTagBeginning = fileContent.indexOf(cssContent);

	if (err.name === 'CssSyntaxError') {
		const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);

		return new CSSError({
			...ErrorData.CSSSyntaxError,
			message: err.reason,
			location: {
				file: filename,
				line: errorLine,
				column: err.column,
			},
			stack: err.stack,
		});
	}

	if (err.line && err.column) {
		const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);

		return new CSSError({
			...ErrorData.UnknownCSSError,
			message: err.message,
			location: {
				file: filename,
				line: errorLine,
				column: err.column,
			},
			frame: err.frame,
			stack: err.stack,
		});
	}

	const errorPosition = positionAt(styleTagBeginning, fileContent);
	errorPosition.line += 1;

	return new CSSError({
		name: 'CSSError',
		message: err.message,
		location: {
			file: filename,
			line: errorPosition.line,
			column: 0,
		},
		frame: err.frame,
		stack: err.stack,
	});
}
