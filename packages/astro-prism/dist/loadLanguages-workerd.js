import Prism from 'prismjs';
import components from 'prismjs/components.js';
import getLoader from 'prismjs/dependencies.js';
import { bundledLanguages } from 'virtual:astro-cloudflare:prism';
const loadChainer = {
	series: async (before, after) => {
		await before;
		await after();
	},
	parallel: async (values) => {
		await Promise.all(values);
	},
};
let prismRefCount = 0;
const prismRefCounter = {
	increment: () => {
		if (prismRefCount === 0) {
			globalThis.Prism = Prism;
		}
		prismRefCount += 1;
	},
	decrement: () => {
		prismRefCount -= 1;
		if (prismRefCount === 0) {
			delete globalThis.Prism;
		}
	},
};
const loadedLanguages = /* @__PURE__ */ new Set();
async function loadLanguages(languages) {
	prismRefCounter.increment();
	if (languages === void 0) {
		languages = Object.keys(components.languages).filter((l) => l !== 'meta');
	} else if (!Array.isArray(languages)) {
		languages = [languages];
	}
	const loaded = [...loadedLanguages, ...Object.keys(Prism.languages)];
	await getLoader(components, languages, loaded).load(async (lang) => {
		if (!(lang in components.languages)) {
			if (!loadLanguages.silent) {
				console.warn('Language does not exist: ' + lang);
			}
			return;
		}
		delete Prism.languages[lang];
		if (Object.hasOwn(bundledLanguages, lang)) {
			await bundledLanguages[lang]();
		}
		loadedLanguages.add(lang);
	}, loadChainer);
	prismRefCounter.decrement();
}
loadLanguages.silent = false;
export { loadLanguages };
