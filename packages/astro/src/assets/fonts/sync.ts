import type { AstroSettings } from '../../types/astro.js';
import { FONTS_TYPES_FILE } from './constants.js';
import { getFamilyName } from './utils.js';

export function syncFonts(settings: AstroSettings): void {
	if (!settings.config.experimental.fonts) {
		return;
	}

	settings.injectedTypes.push({
		filename: FONTS_TYPES_FILE,
		content: `declare module 'astro:assets' {
	export type FontFamily = (${JSON.stringify(settings.config.experimental.fonts.families.map((family) => getFamilyName(family)))})[number];
}
`,
	});
}
