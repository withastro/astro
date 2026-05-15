import type { AstroVersionProvider, TextStyler } from '../definitions.js';
interface Options {
	name: string;
	textStyler: TextStyler;
	astroVersionProvider: AstroVersionProvider;
}
export declare function formatVersion({ name, textStyler, astroVersionProvider }: Options): string;
export {};
