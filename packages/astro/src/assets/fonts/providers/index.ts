import {
	type AdobeProviderOptions,
	type GoogleFamilyOptions,
	type GoogleiconsFamilyOptions,
	type InitializedProvider,
	type NpmProviderOptions,
	type NpmFamilyOptions,
	providers,
} from 'unifont';
import { FontaceFontFileReader } from '../infra/fontace-font-file-reader.js';
import type { FontProvider } from '../types.js';
import { type LocalFamilyOptions, LocalFontProvider } from './local.js';
import { fileURLToPath } from 'node:url';

/** [Adobe](https://fonts.adobe.com/) */
function adobe(config: AdobeProviderOptions): FontProvider {
	const provider = providers.adobe(config);
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		config,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}

/** [Bunny](https://fonts.bunny.net/) */
function bunny(): FontProvider {
	const provider = providers.bunny();
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}

/** [Fontshare](https://www.fontshare.com/) */
function fontshare(): FontProvider {
	const provider = providers.fontshare();
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}

/** [Fontsource](https://fontsource.org/) */
function fontsource(): FontProvider {
	const provider = providers.fontsource();
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}

/** [Google](https://fonts.google.com/) */
function google(): FontProvider<GoogleFamilyOptions | undefined> {
	const provider = providers.google();
	let initializedProvider: InitializedProvider<GoogleFamilyOptions> | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}

/** [Google Icons](https://fonts.google.com/icons) */
function googleicons(): FontProvider<GoogleiconsFamilyOptions | undefined> {
	const provider = providers.googleicons();
	let initializedProvider: InitializedProvider<GoogleiconsFamilyOptions> | undefined;
	return {
		name: provider._name,
		async init(context) {
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}

/** [NPM](TODO:) */
function npm(
	options?: Omit<NpmProviderOptions, 'root'>,
): FontProvider<NpmFamilyOptions | undefined> {
	let initializedProvider: InitializedProvider<NpmFamilyOptions> | undefined;
	return {
		name: providers.npm()._name,
		async init(context) {
			initializedProvider = await providers.npm({ ...options, root: fileURLToPath(context.root) })(
				context,
			);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
	};
}

/** A provider that handles local files. */
function local(): FontProvider<LocalFamilyOptions> {
	return new LocalFontProvider({
		fontFileReader: new FontaceFontFileReader(),
	});
}

/**
 * Astro exports a few built-in providers:
 * - [Adobe](https://fonts.adobe.com/)
 * - [Bunny](https://fonts.bunny.net/)
 * - [Fontshare](https://www.fontshare.com/)
 * - [Fontsource](https://fontsource.org/)
 * - [Google](https://fonts.google.com/)
 * - [Google Icons](https://fonts.google.com/icons)
 * - [NPM](TODO:)
 * - Local
 */
export const fontProviders = {
	adobe,
	bunny,
	fontshare,
	fontsource,
	google,
	googleicons,
	npm,
	local,
};
