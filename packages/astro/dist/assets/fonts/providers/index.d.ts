import {
	type AdobeProviderOptions,
	type GoogleFamilyOptions,
	type GoogleiconsFamilyOptions,
	type NpmProviderOptions,
	type NpmFamilyOptions,
} from 'unifont';
import type { FontProvider } from '../types.js';
import { type LocalFamilyOptions } from './local.js';
/** [Adobe](https://docs.astro.build/en/reference/font-provider-reference/#adobe) */
declare function adobe(config: AdobeProviderOptions): FontProvider;
/** [Bunny](https://docs.astro.build/en/reference/font-provider-reference/#bunny) */
declare function bunny(): FontProvider;
/** [Fontshare](https://docs.astro.build/en/reference/font-provider-reference/#fontshare) */
declare function fontshare(): FontProvider;
/** [Fontsource](https://docs.astro.build/en/reference/font-provider-reference/#fontsource) */
declare function fontsource(): FontProvider;
/** [Google](https://docs.astro.build/en/reference/font-provider-reference/#google) */
declare function google(): FontProvider<GoogleFamilyOptions | undefined>;
/** [Google Icons](https://docs.astro.build/en/reference/font-provider-reference/#google-icons) */
declare function googleicons(): FontProvider<GoogleiconsFamilyOptions | undefined>;
/** [Local](https://docs.astro.build/en/reference/font-provider-reference/#local) */
declare function local(): FontProvider<LocalFamilyOptions>;
/** [NPM](https://docs.astro.build/en/reference/font-provider-reference/#npm) */
declare function npm(
	options?: Omit<NpmProviderOptions, 'root' | 'readFile'>,
): FontProvider<NpmFamilyOptions | undefined>;
/**
 * Astro exports a few built-in providers:
 * - [Adobe](https://docs.astro.build/en/reference/font-provider-reference/#adobe)
 * - [Bunny](https://docs.astro.build/en/reference/font-provider-reference/#bunny)
 * - [Fontshare](https://docs.astro.build/en/reference/font-provider-reference/#fontshare)
 * - [Fontsource](https://docs.astro.build/en/reference/font-provider-reference/#fontsource)
 * - [Google](https://docs.astro.build/en/reference/font-provider-reference/#google)
 * - [Google Icons](https://docs.astro.build/en/reference/font-provider-reference/#google-icons)
 * - [Local](https://docs.astro.build/en/reference/font-provider-reference/#local)
 * - [NPM](TODO:)
 */
export declare const fontProviders: {
	adobe: typeof adobe;
	bunny: typeof bunny;
	fontshare: typeof fontshare;
	fontsource: typeof fontsource;
	google: typeof google;
	googleicons: typeof googleicons;
	local: typeof local;
	npm: typeof npm;
};
export {};
