import type {
	AdobeProviderOptions,
	GoogleFamilyOptions,
	GoogleiconsFamilyOptions,
	InitializedProvider,
	NpmProviderOptions,
	NpmFamilyOptions,
} from 'unifont';
import { FontaceFontFileReader } from '../infra/fontace-font-file-reader.js';
import type { FontProvider } from '../types.js';
import { type LocalFamilyOptions, LocalFontProvider } from './local.js';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const VARIABLE_SUFFIX_RE = / Variable$/;

// `astro/config` re-exports these factories, so unifont (and its css-tree dependency) is
// imported on first use rather than whenever a config file is loaded.
async function loadUnifontProviders() {
	return (await import('unifont')).providers;
}

/** [Adobe](https://docs.astro.build/en/reference/font-provider-reference/#adobe) */
function adobe(config: AdobeProviderOptions): FontProvider {
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: 'adobe',
		config,
		async init(context) {
			const providers = await loadUnifontProviders();
			initializedProvider = await providers.adobe(config)(context);
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
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: 'bunny',
		async init(context) {
			const providers = await loadUnifontProviders();
			initializedProvider = await providers.bunny()(context);
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
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: 'fontshare',
		async init(context) {
			const providers = await loadUnifontProviders();
			initializedProvider = await providers.fontshare()(context);
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
	let initializedProvider: InitializedProvider | undefined;
	return {
		name: 'fontsource',
		async init(context) {
			const providers = await loadUnifontProviders();
			initializedProvider = await providers.fontsource()(context);
		},
		async resolveFont({ familyName, ...rest }) {
			const result = await initializedProvider?.resolveFont(familyName, rest);
			// The fontsource API uses family names without a "Variable" suffix (e.g. "Inter"),
			// but fontsource's website and npm packages use "Inter Variable" for variable fonts.
			// Retry without the suffix so both naming conventions work. See #18143.
			if (!result?.fonts?.length && familyName.endsWith(' Variable')) {
				return await initializedProvider?.resolveFont(
					familyName.replace(VARIABLE_SUFFIX_RE, ''),
					rest,
				);
			}
			return result;
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
	let initializedProvider: InitializedProvider<GoogleFamilyOptions> | undefined;
	return {
		name: 'google',
		async init(context) {
			const providers = await loadUnifontProviders();
			initializedProvider = await providers.google()(context);
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
	let initializedProvider: InitializedProvider<GoogleiconsFamilyOptions> | undefined;
	return {
		name: 'googleicons',
		async init(context) {
			const providers = await loadUnifontProviders();
			initializedProvider = await providers.googleicons()(context);
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
		name: 'npm',
		async init(context) {
			const providers = await loadUnifontProviders();
			initializedProvider = await providers.npm({
				...options,
				root: fileURLToPath(context.root),
				readFile: (path) => readFile(path, 'utf-8').catch(() => null),
			})(context);
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
