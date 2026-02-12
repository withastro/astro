import fs from 'node:fs';
import type { TransformOptions } from '@astrojs/compiler';
import { preprocessCSS, type ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../types/public/config.js';
import { AstroErrorData, CSSError, positionAt } from '../errors/index.js';
import { normalizePath } from '../viteUtils.js';
import type { CompileCssResult } from './types.js';

export type PartialCompileCssResult = Pick<CompileCssResult, 'isGlobal' | 'dependencies'>;

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
	// Only rewrite if base is not the default '/'
	if (!base || base === '/') {
		return css;
	}

	// Normalize base path (remove trailing slash for consistent joining)
	const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

	// Safety check: base should start with '/' (already normalized by Astro config)
	if (!normalizedBase.startsWith('/')) {
		return css;
	}

	// Vite's production-tested regex for matching url() in CSS
	// Matches url(...) while handling quotes, unquoted URLs, and edge cases
	// Excludes @import statements via negative lookbehind
	// Matches Vite's cssUrlRE pattern exactly - capturing groups preserved for compatibility
	const cssUrlRE =
		// eslint-disable-next-line regexp/no-unused-capturing-group
		/(?<!@import\s+)(?<=^|[^\w\-\u0080-\uffff])url\((\s*('[^']+'|"[^"]+")\s*|(?:\\.|[^'")\\])+)\)/g;

	return css.replace(cssUrlRE, (match, rawUrl: string) => {
		// Extract URL value, removing quotes if present
		let url = rawUrl.trim();
		let quote = '';

		// Check if URL is quoted (single or double)
		if ((url.startsWith("'") && url.endsWith("'")) || (url.startsWith('"') && url.endsWith('"'))) {
			quote = url[0];
			url = url.slice(1, -1);
		}

		url = url.trim();

		// Only rewrite root-relative URLs (start with / but not //)
		const isRootRelative = url.startsWith('/') && !url.startsWith('//');

		// Skip external URLs and data URIs
		const isExternal =
			url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:');

		// Skip if already has base path (makes function idempotent)
		const alreadyHasBase = url.startsWith(normalizedBase + '/');

		if (isRootRelative && !isExternal && !alreadyHasBase) {
			return `url(${quote}${normalizedBase}${url}${quote})`;
		}

		return match;
	});
}

export function createStylePreprocessor({
	filename,
	viteConfig,
	astroConfig,
	cssPartialCompileResults,
	cssTransformErrors,
}: {
	filename: string;
	viteConfig: ResolvedConfig;
	astroConfig: AstroConfig;
	cssPartialCompileResults: Partial<CompileCssResult>[];
	cssTransformErrors: Error[];
}): TransformOptions['preprocessStyle'] {
	let processedStylesCount = 0;

	return async (content, attrs) => {
		const index = processedStylesCount++;
		const lang = `.${attrs?.lang || 'css'}`.toLowerCase();
		const id = `${filename}?astro&type=style&index=${index}&lang${lang}`;
		try {
			const result = await preprocessCSS(content, id, viteConfig);

			// Rewrite CSS URLs to include the base path
			// This is necessary because preprocessCSS doesn't handle URL rewriting
			const rewrittenCode = rewriteCssUrls(result.code, astroConfig.base);

			cssPartialCompileResults[index] = {
				isGlobal: !!attrs['is:global'],
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

	// PostCSS Syntax Error
	if (err.name === 'CssSyntaxError') {
		const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);

		// Vite will handle creating the frame for us with proper line numbers, no need to create one

		return new CSSError({
			...AstroErrorData.CSSSyntaxError,
			message: err.reason,
			location: {
				file: filename,
				line: errorLine,
				column: err.column,
			},
			stack: err.stack,
		});
	}

	// Some CSS processor will return a line and a column, so let's try to show a pretty error
	if (err.line && err.column) {
		const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);

		return new CSSError({
			...AstroErrorData.UnknownCSSError,
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

	// For other errors we'll just point to the beginning of the style tag
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
