import Prism from 'prismjs';
import { addAstro } from './plugin.js';

// Expose Prism as a global so that `prismjs/components/index.js` can find it.
// PrismJS's language loader references `Prism` as a bare global identifier and relies on
// `global.Prism` being set, which only works in Node.js. In runtimes like Cloudflare Workers
// (workerd), `global` doesn't exist, so the global is never set. Using `globalThis` ensures
// the Prism object is accessible in all environments.
globalThis.Prism = Prism;

// `prismjs/components/index.js` is a CJS module that uses `require()` to dynamically load
// language grammars at runtime. This works in Node.js but fails in ESM-only runtimes like
// Cloudflare Workers (workerd) where `require()` is not available. We wrap the import in a
// try/catch and fall back to a no-op, so that only the built-in Prism languages
// (markup, css, clike, javascript) are available when dynamic loading is unsupported.
let loadLanguages: ((languages: string[]) => void) | undefined;
try {
	loadLanguages = (await import('prismjs/components/index.js')).default;
} catch {
	// Dynamic language loading unavailable (e.g. Cloudflare Workers / workerd).
	// Only built-in Prism grammars will be available.
}

const languageMap = new Map([['ts', 'typescript']]);

export function runHighlighterWithAstro(lang: string | undefined, code: string) {
	if (!lang) {
		lang = 'plaintext';
	}
	let classLanguage = `language-${lang}`;
	const ensureLoaded = (language: string) => {
		if (language && !Prism.languages[language] && loadLanguages) {
			try {
				loadLanguages([language]);
			} catch {
				// Language loading failed (e.g. `require()` unavailable in the current runtime).
			}
		}
	};

	if (languageMap.has(lang)) {
		ensureLoaded(languageMap.get(lang)!);
	} else if (lang === 'astro') {
		ensureLoaded('typescript');
		addAstro(Prism);
	} else {
		ensureLoaded('markup-templating'); // Prism expects this to exist for a number of other langs
		ensureLoaded(lang);
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
