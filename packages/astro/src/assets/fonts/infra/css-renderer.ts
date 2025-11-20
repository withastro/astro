import type { CssProperties, CssRenderer } from '../definitions.js';

export function renderFontFace(properties: CssProperties, minify: boolean): string {
	// Line feed
	const lf = minify ? '' : `\n`;
	// Space
	const sp = minify ? '' : ' ';

	return `@font-face${sp}{${lf}${Object.entries(properties)
		.filter(([, value]) => Boolean(value))
		.map(([key, value]) => `${sp}${sp}${key}:${sp}${value};`)
		.join(lf)}${lf}}${lf}`;
}

export function renderCssVariable(key: string, values: Array<string>, minify: boolean): string {
	// Line feed
	const lf = minify ? '' : `\n`;
	// Space
	const sp = minify ? '' : ' ';

	return `:root${sp}{${lf}${sp}${sp}${key}:${sp}${values.map((v) => handleValueWithSpaces(v)).join(`,${sp}`)};${lf}}${lf}`;
}

export function withFamily(family: string, properties: CssProperties): CssProperties {
	return {
		'font-family': handleValueWithSpaces(family),
		...properties,
	};
}

const SPACE_RE = /\s/;

/** If the value contains spaces (which would be incorrectly interpreted), we wrap it in quotes. */
export function handleValueWithSpaces(value: string): string {
	if (SPACE_RE.test(value)) {
		return JSON.stringify(value);
	}
	return value;
}

export function createMinifiableCssRenderer({ minify }: { minify: boolean }): CssRenderer {
	return {
		generateFontFace(family, properties) {
			return renderFontFace(withFamily(family, properties), minify);
		},
		generateCssVariable(key, values) {
			return renderCssVariable(key, values, minify);
		},
	};
}
