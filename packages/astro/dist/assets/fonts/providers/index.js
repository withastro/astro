import { providers } from 'unifont';
import { FontaceFontFileReader } from '../infra/fontace-font-file-reader.js';
import { LocalFontProvider } from './local.js';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
function adobe(config) {
	const provider = providers.adobe(config);
	let initializedProvider;
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
function bunny() {
	const provider = providers.bunny();
	let initializedProvider;
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
function fontshare() {
	const provider = providers.fontshare();
	let initializedProvider;
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
function fontsource() {
	const provider = providers.fontsource();
	let initializedProvider;
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
function google() {
	const provider = providers.google();
	let initializedProvider;
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
function googleicons() {
	const provider = providers.googleicons();
	let initializedProvider;
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
function local() {
	return new LocalFontProvider({
		fontFileReader: new FontaceFontFileReader(),
	});
}
function npm(options) {
	let initializedProvider;
	return {
		name: providers.npm()._name,
		async init(context) {
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
	};
}
const fontProviders = {
	adobe,
	bunny,
	fontshare,
	fontsource,
	google,
	googleicons,
	local,
	npm,
};
export { fontProviders };
