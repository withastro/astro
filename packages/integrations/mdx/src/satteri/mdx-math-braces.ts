/**
 * Workaround for satteri's MDX parser not treating inline math `$...$` as
 * atomic: the MDX expression scanner sees `{…}` brace groups inside math spans
 * and tries to parse them as JSX expressions. If the content is not valid JS
 * (e.g. `$e^{-\ln(2)/h}$`), the compile fails.
 *
 * This module replaces braces inside inline-math dollar spans with unique
 * placeholders *before* the content reaches satteri's parser, then restores
 * them in the generated JS output. Display math (`$$…$$`) is already parsed
 * atomically by satteri and is left untouched.
 *
 * See https://github.com/withastro/astro/issues/17646
 */

// Placeholders use characters from the Private Use Area (U+E000–U+F8FF) which
// are guaranteed not to appear in normal Markdown/MDX content or JS output.
const LBRACE = '\uE000';
const RBRACE = '\uE001';

/**
 * Matches an inline-math `$…$` span. The dollar signs must not be preceded or
 * followed by another `$` (that would be display math). Inside the span,
 * backslash-escapes and any non-`$` character are consumed.
 */
const INLINE_MATH_RE = /(?<!\$)\$((?:[^$\\]|\\.)+)\$(?!\$)/g;

/** Replace `{` / `}` inside inline-math spans with Private Use Area placeholders. */
export function escapeBracesInInlineMath(source: string): string {
	return source.replace(INLINE_MATH_RE, (_match, inner: string) => {
		if (!inner.includes('{') && !inner.includes('}')) return _match;
		return '$' + inner.replaceAll('{', LBRACE).replaceAll('}', RBRACE) + '$';
	});
}

/** Restore placeholder sequences back to real braces in generated code. */
export function restoreBracesInOutput(code: string): string {
	return code.replaceAll(LBRACE, '{').replaceAll(RBRACE, '}');
}
