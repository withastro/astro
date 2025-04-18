import type { CssRenderer } from '../definitions.js';

export function renderFontFace(
	properties: Record<string, string | undefined>,
	minify: boolean,
): string {
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

export class PrettyCssRenderer implements CssRenderer {
	generateFontFace(family: string, properties: Record<string, string | undefined>): string {
		return renderFontFace(
			{
				'font-family': family,
				...properties,
			},
			false,
		);
	}
	generateCssVariable(key: string, values: Array<string>): string {
		return renderCssVariable(key, values, false);
	}
}

export class MinifiedCssRenderer implements CssRenderer {
	generateFontFace(family: string, properties: Record<string, string | undefined>): string {
		return renderFontFace(
			{
				'font-family': family,
				...properties,
			},
			true,
		);
	}
	generateCssVariable(key: string, values: Array<string>): string {
		return renderCssVariable(key, values, true);
	}
}
