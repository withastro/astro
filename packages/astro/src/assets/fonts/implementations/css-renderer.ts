import type { CssRenderer } from '../definitions.js';

type Properties = Record<string, string | undefined>;

export function renderFontFace(properties: Properties, minify: boolean): string {
	// Line return
	const lr = minify ? '' : `\n`;
	// Space
	const sp = minify ? '' : ' ';

	return `@font-face${sp}{${lr}${Object.entries(properties)
		.filter(([, value]) => Boolean(value))
		.map(([key, value]) => `${sp}${sp}${key}:${sp}${value};`)
		.join(lr)}${lr}}${lr}`;
}

export function renderCssVariable(key: string, values: Array<string>, minify: boolean): string {
	// Line return
	const lr = minify ? '' : `\n`;
	// Space
	const sp = minify ? '' : ' ';

	return `:root${sp}{${lr}${sp}${sp}${key}:${sp}${values.join(`,${sp}`)};${lr}}${lr}`;
}

export function withFamily(family: string, properties: Properties): Properties {
	return {
		'font-family': handleValueWithSpaces(family),
		...properties,
	};
}

const SPACE_RE = /\s/;

export function handleValueWithSpaces(value: string): string {
	if (SPACE_RE.test(value)) {
		return JSON.stringify(value);
	}
	return value;
}

export class PrettyCssRenderer implements CssRenderer {
	generateFontFace(family: string, properties: Properties): string {
		return renderFontFace(withFamily(family, properties), false);
	}
	generateCssVariable(key: string, values: Array<string>): string {
		return renderCssVariable(key, values, false);
	}
}

export class MinifiedCssRenderer implements CssRenderer {
	generateFontFace(family: string, properties: Properties): string {
		return renderFontFace(withFamily(family, properties), true);
	}
	generateCssVariable(key: string, values: Array<string>): string {
		return renderCssVariable(key, values, true);
	}
}
