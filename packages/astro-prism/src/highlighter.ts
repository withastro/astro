import Prism from 'prismjs';
import { loadLanguages } from '#prism-loadLanguages';
import { addAstro } from './plugin.js';

const languageMap = new Map([['ts', 'typescript']]);

export async function runHighlighterWithAstro(lang: string | undefined, code: string) {
	if (!lang) {
		lang = 'plaintext';
	}
	let classLanguage = `language-${lang}`;
	const ensureLoaded = async (language: string) => {
		if (language && !Prism.languages[language]) {
			await loadLanguages([language]);
		}
	};

	if (languageMap.has(lang)) {
		await ensureLoaded(languageMap.get(lang)!);
	} else if (lang === 'astro') {
		await ensureLoaded('typescript');
		addAstro(Prism);
	} else {
		await ensureLoaded('markup-templating'); // Prism expects this to exist for a number of other langs
		await ensureLoaded(lang);
	}

	if (lang && !Prism.languages[lang]) {
		console.warn(`Unable to load the language: ${lang}`);
	}

	const grammar = Prism.languages[lang];
	let html = code;
	if (grammar) {
		html = Prism.highlight(code, grammar, lang);
	}

	return { classLanguage, html };
}
