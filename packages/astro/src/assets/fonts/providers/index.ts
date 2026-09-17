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
import { readFile } from 'node:fs/promises';

/** [Adobe](https://docs.astro.build/en/reference/font-provider-reference/#adobe) */
function adobe(config: AdobeProviderOptions): FontProvider {
	const provider = providers.adobe(config);
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		config,
		async init(context) {
			// @ts-expect-error `fetch` is deliberately not part of Astro's public provider
			// context. unifont still types it as required but does not need us to pass it.
			// TODO: drop this once unifont makes `fetch` optional in its provider context
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
		async getFontProperties({ familyName }) {
			return await initializedProvider?.getFontProperties?.(familyName);
		},
	};
}

/** [Bunny](https://docs.astro.build/en/reference/font-provider-reference/#bunny) */
function bunny(): FontProvider {
	const provider = providers.bunny();
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			// @ts-expect-error `fetch` is deliberately not part of Astro's public provider
			// context. unifont still types it as required but does not need us to pass it.
			// TODO: drop this once unifont makes `fetch` optional in its provider context
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
		async getFontProperties({ familyName }) {
			return await initializedProvider?.getFontProperties?.(familyName);
		},
	};
}

/** [Fontshare](https://docs.astro.build/en/reference/font-provider-reference/#fontshare) */
function fontshare(): FontProvider {
	const provider = providers.fontshare();
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			// @ts-expect-error `fetch` is deliberately not part of Astro's public provider
			// context. unifont still types it as required but does not need us to pass it.
			// TODO: drop this once unifont makes `fetch` optional in its provider context
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
		async getFontProperties({ familyName }) {
			return await initializedProvider?.getFontProperties?.(familyName);
		},
	};
}

/** [Fontsource](https://docs.astro.build/en/reference/font-provider-reference/#fontsource) */
function fontsource(): FontProvider {
	const provider = providers.fontsource();
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: provider._name,
		async init(context) {
			// @ts-expect-error `fetch` is deliberately not part of Astro's public provider
			// context. unifont still types it as required but does not need us to pass it.
			// TODO: drop this once unifont makes `fetch` optional in its provider context
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
		async getFontProperties({ familyName }) {
			return await initializedProvider?.getFontProperties?.(familyName);
		},
	};
}

/** [Google](https://docs.astro.build/en/reference/font-provider-reference/#google) */
function google(): FontProvider<GoogleFamilyOptions | undefined> {
	const provider = providers.google();
	let initializedProvider: InitializedProvider<GoogleFamilyOptions> | undefined;
	return {
		name: provider._name,
		async init(context) {
			// @ts-expect-error `fetch` is deliberately not part of Astro's public provider
			// context. unifont still types it as required but does not need us to pass it.
			// TODO: drop this once unifont makes `fetch` optional in its provider context
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
		async getFontProperties({ familyName }) {
			return await initializedProvider?.getFontProperties?.(familyName);
		},
	};
}

/** [Google Icons](https://docs.astro.build/en/reference/font-provider-reference/#google-icons) */
function googleicons(): FontProvider<GoogleiconsFamilyOptions | undefined> {
	const provider = providers.googleicons();
	let initializedProvider: InitializedProvider<GoogleiconsFamilyOptions> | undefined;
	return {
		name: provider._name,
		async init(context) {
			// @ts-expect-error `fetch` is deliberately not part of Astro's public provider
			// context. unifont still types it as required but does not need us to pass it.
			// TODO: drop this once unifont makes `fetch` optional in its provider context
			initializedProvider = await provider(context);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
		async getFontProperties({ familyName }) {
			return await initializedProvider?.getFontProperties?.(familyName);
		},
	};
}

/** [Local](https://docs.astro.build/en/reference/font-provider-reference/#local) */
function local(): FontProvider<LocalFamilyOptions> {
	return new LocalFontProvider({
		fontFileReader: new FontaceFontFileReader(),
	});
}

/** [NPM](https://docs.astro.build/en/reference/font-provider-reference/#npm) */
function npm(
	options?: Omit<NpmProviderOptions, 'root' | 'readFile'>,
): FontProvider<NpmFamilyOptions | undefined> {
	let initializedProvider: InitializedProvider<NpmFamilyOptions> | undefined;
	return {
		name: providers.npm()._name,
		async init(context) {
			initializedProvider = await providers.npm({
				...options,
				root: fileURLToPath(context.root),
				readFile: (path) => readFile(path, 'utf-8').catch(() => null),
			})(
				// @ts-expect-error `fetch` is deliberately not part of Astro's public provider
				// context. unifont still types it as required but does not need us to pass it.
				// TODO: drop this once unifont makes `fetch` optional in its provider context
				context,
			);
		},
		async resolveFont({ familyName, ...rest }) {
			return await initializedProvider?.resolveFont(familyName, rest);
		},
		async listFonts() {
			return await initializedProvider?.listFonts?.();
		},
		async getFontProperties({ familyName }) {
			return await initializedProvider?.getFontProperties?.(familyName);
		},
	};
}

/**
 * Astro exports a few built-in providers:
 * - [Adobe](https://docs.astro.build/en/reference/font-provider-reference/#adobe)
 * - [Bunny](https://docs.astro.build/en/reference/font-provider-reference/#bunny)
 * - [Fontshare](https://docs.astro.build/en/reference/font-provider-reference/#fontshare)
 * - [Fontsource](https://docs.astro.build/en/reference/font-provider-reference/#fontsource)
 * - [Google](https://docs.astro.build/en/reference/font-provider-reference/#google)
 * - [Google Icons](https://docs.astro.build/en/reference/font-provider-reference/#google-icons)
 * - [Local](https://docs.astro.build/en/reference/font-provider-reference/#local)
 * - [NPM](https://docs.astro.build/en/reference/font-provider-reference/#npm)
 */
export const fontProviders = {
	adobe,
	bunny,
	fontshare,
	fontsource,
	google,
	googleicons,
	local,
	npm,
};
