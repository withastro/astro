import { FONTS_TYPES_FILE } from './constants.js';
function syncFonts(settings) {
	if (!settings.config.fonts) {
		return;
	}
	settings.injectedTypes.push({
		filename: FONTS_TYPES_FILE,
		content: `declare module 'astro:assets' {
	/** @internal */
	export type CssVariable = (${JSON.stringify(settings.config.fonts.map((family) => family.cssVariable))})[number];
}
`,
	});
}
export { syncFonts };
