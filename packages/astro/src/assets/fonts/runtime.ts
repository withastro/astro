import { fontDataByCssVariable } from 'virtual:astro:assets/fonts/internal';

const WOFF2_FORMATS = new Set(['woff2']);
const warnedVariables = new Set<string>();

function hasOnlyWoff2Sources(fonts: Array<{ src: Array<{ format?: string }> }>): boolean {
	return fonts.every(
		(font) =>
			font.src.length > 0 &&
			font.src.every((src) => src.format !== undefined && WOFF2_FORMATS.has(src.format)),
	);
}

export const fontData: typeof fontDataByCssVariable = new Proxy(fontDataByCssVariable, {
	get(target, prop, receiver) {
		const value = Reflect.get(target, prop, receiver);
		if (typeof prop === 'string' && Array.isArray(value) && !warnedVariables.has(prop)) {
			warnedVariables.add(prop);
			if (hasOnlyWoff2Sources(value)) {
				console.warn(
					`[astro:fonts] The font data for "${prop}" only includes woff2 format sources. Some tools (e.g. satori, used for OG image generation) do not support woff2. To use fontData with these tools, add a compatible format such as "ttf" or "woff" to the "formats" option in your font configuration:\n\n  formats: ["woff2", "ttf"]\n`,
				);
			}
		}
		return value;
	},
});
