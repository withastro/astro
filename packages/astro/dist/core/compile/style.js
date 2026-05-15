import fs from 'node:fs';
import { createRequire } from 'node:module';
import { preprocessCSS } from 'vite';
import { AstroErrorData, CSSError, positionAt } from '../errors/index.js';
import { normalizePath } from '../viteUtils.js';
function rewriteCssUrls(css, base) {
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
	return css.replace(cssUrlRE, (match, rawUrl) => {
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
function withNestingExcluded(viteConfig) {
	let Features;
	try {
		const requireFromRoot = createRequire(viteConfig.root + '/');
		Features = requireFromRoot('lightningcss').Features;
	} catch {
		return void 0;
	}
	const lcss = viteConfig.css?.lightningcss ?? {};
	const prevExclude = lcss.exclude ?? 0;
	return {
		...viteConfig,
		css: { ...viteConfig.css, lightningcss: { ...lcss, exclude: prevExclude | Features.Nesting } },
	};
}
function createStylePreprocessor({
	filename,
	viteConfig,
	astroConfig,
	cssPartialCompileResults,
	cssTransformErrors,
}) {
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
			const rewrittenCode = rewriteCssUrls(result.code, astroConfig.base);
			cssPartialCompileResults[index] = {
				// Use `in` operator to handle both Go compiler (boolean `true`) and
				// Rust compiler (empty string `""`) representations of boolean attributes.
				isGlobal: 'is:global' in attrs,
				dependencies: result.deps ? [...result.deps].map((dep) => normalizePath(dep)) : [],
			};
			let map;
			if (result.map) {
				if (typeof result.map === 'string') {
					map = result.map;
				} else if (result.map.mappings) {
					map = result.map.toString();
				}
			}
			return { code: rewrittenCode, map };
		} catch (err) {
			try {
				err = enhanceCSSError(err, filename, content);
			} catch {}
			cssTransformErrors.push(err);
			return { error: err + '' };
		}
	};
}
function enhanceCSSError(err, filename, cssContent) {
	const fileContent = fs.readFileSync(filename).toString();
	const styleTagBeginning = fileContent.indexOf(cssContent);
	if (err.name === 'CssSyntaxError') {
		const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);
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
export { createStylePreprocessor };
