import type { AstroVersionProvider, TextStyler } from '../definitions.js';

interface Options {
	name: string;
	textStyler: TextStyler;
	astroVersionProvider: AstroVersionProvider;
}

export function formatVersion({ name, textStyler, astroVersionProvider }: Options) {
	return `  ${textStyler.bgGreen(textStyler.black(` ${name} `))} ${textStyler.green(
		`v${astroVersionProvider.getVersion()}`,
	)}`;
}
