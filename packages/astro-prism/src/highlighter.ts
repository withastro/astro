import Prism from 'prismjs';
import { addAstro } from './plugin.js';

// `prismjs/components/index.js` is a CJS module that uses `require()` to dynamically load
// language grammars. This is incompatible with ESM-only runtimes like Cloudflare Workers (workerd).
// We use `createRequire` from `node:module` to load it in Node.js environments where CJS is
// supported. In other runtimes, we gracefully degrade — the base Prism module already includes
// markup, css, clike, and javascript grammars.
let loadLanguages: ((languages: string[]) => void) | undefined;
try {
	// Dynamic import of `node:module` to avoid static import failures in non-Node.js runtimes.
	// Vite recognizes `node:` imports as externals and won't try to bundle them.
	const nodeModule = await import(/* @vite-ignore */ 'node:module');
	loadLanguages = nodeModule.createRequire(import.meta.url)('prismjs/components/index.js');
} catch {
	// In non-Node.js environments (e.g. workerd), createRequire or require() may be unavailable.
	// Language loading will be skipped and only built-in grammars will work.
}

const languageMap = new Map([['ts', 'typescript']]);

export function runHighlighterWithAstro(lang: string | undefined, code: string) {
	if (!lang) {
		lang = 'plaintext';
	}
	let classLanguage = `language-${lang}`;
	const ensureLoaded = (language: string) => {
		if (language && !Prism.languages[language]) {
			if (loadLanguages) {
				loadLanguages([language]);
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
