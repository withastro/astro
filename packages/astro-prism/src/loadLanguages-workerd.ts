// This implementation was based from: https://github.com/PrismJS/prism/blob/76dde18a575831c91491895193f56081ac08b0c5/components/index.js
import Prism from 'prismjs';
import components from 'prismjs/components.js';
import getLoader, { type LoadChainer } from 'prismjs/dependencies.js';

const prismLanguageFiles = import.meta.glob('../node_modules/prismjs/components/prism-*.js');

// This `loadChainer` is required when working with Promises in Prism's loader.
// ref: https://github.com/PrismJS/prism/blob/76dde18a575831c91491895193f56081ac08b0c5/dependencies.js#L346-L360
const loadChainer: LoadChainer<Promise<void>> = {
	series: async (before, after) => {
		await before;
		await after();
	},
	parallel: async (values) => {
		await Promise.all(values);
	},
};

// Since Prism language files are written assuming the Prism instance is defined
// as a global variable, we will temporarily set the Prism instance globally.
function setPrismAsGlobal() {
	globalThis.Prism = Prism;

	return () => {
		// @ts-expect-error globalThis type
		delete globalThis.Prism;
	};
}

/**
 * The set of all languages which have been loaded using the below function.
 *
 * @type {Set<string>}
 */
const loadedLanguages = new Set<string>();

/**
 * Loads the given languages and adds them to the current Prism instance.
 *
 * If no languages are provided, __all__ Prism languages will be loaded.
 *
 * @param {string|string[]} [languages]
 * @returns {Promise<void>}
 */
export async function loadLanguages(languages: string | string[]) {
	const cleanUp = setPrismAsGlobal();

	if (languages === undefined) {
		languages = Object.keys(components.languages).filter((l) => l !== 'meta');
	} else if (!Array.isArray(languages)) {
		languages = [languages];
	}

	// the user might have loaded languages via some other way or used `prism.js` which already includes some
	// we don't need to validate the ids because `getLoader` will ignore invalid ones
	const loaded = [...loadedLanguages, ...Object.keys(Prism.languages)];

	await getLoader(components, languages, loaded).load(async (lang: string) => {
		if (!(lang in components.languages)) {
			if (!loadLanguages.silent) {
				console.warn('Language does not exist: ' + lang);
			}
			return;
		}

		const pathToLanguage = `../node_modules/prismjs/components/prism-${lang}.js`;

		// remove from Prism
		delete Prism.languages[lang];

		if (Object.hasOwn(prismLanguageFiles, pathToLanguage)) {
			await prismLanguageFiles[pathToLanguage]();
		}

		loadedLanguages.add(lang);
	}, loadChainer);

	cleanUp();
}

/**
 * Set this to `true` to prevent all warning messages `loadLanguages` logs.
 */
loadLanguages.silent = false;
