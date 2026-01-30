import type { AstroSettings } from '../../types/astro.js';
import { FONTS_TYPES_FILE } from './constants.js';

export function syncFonts(settings: AstroSettings): void {
	if (!settings.config.experimental.fonts) {
		return;
	}

	settings.injectedTypes.push({
		filename: FONTS_TYPES_FILE,
		content: `declare module 'astro:assets' {
	/** @internal */
	export type CssVariable = (${JSON.stringify(settings.config.experimental.fonts.map((family) => family.cssVariable))})[number];
}
`,
	});
}
