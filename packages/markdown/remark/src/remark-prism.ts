import { addAstro } from '@astrojs/prism/internal';
import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index.js';
import { visit } from 'unist-util-visit';
const noVisit = new Set(['root', 'html', 'text']);

const languageMap = new Map([['ts', 'typescript']]);

function runHighlighter(lang: string, code: string) {
	let classLanguage = `language-${lang}`;

	if (lang == null) {
		lang = 'plaintext';
	}

	const ensureLoaded = (language: string) => {
		if (language && !Prism.languages[language]) {
			loadLanguages([language]);
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
		// eslint-disable-next-line no-console
		console.warn(`Unable to load the language: ${lang}`);
	}

	const grammar = Prism.languages[lang];
	let html = code;
	if (grammar) {
		html = Prism.highlight(code, grammar, lang);
	}

	return { classLanguage, html };
}

type MaybeString = string | null | undefined;

/**  */
function transformer(className: MaybeString) {
	return function (tree: any) {
		const visitor = (node: any) => {
			let { lang, value } = node;
			node.type = 'html';

			let { html, classLanguage } = runHighlighter(lang, value);
			let classes = [classLanguage];
			if (className) {
				classes.push(className);
			}
			node.value = `<pre class="${classes.join(
				' '
			)}"><code is:raw class="${classLanguage}">${html}</code></pre>`;
			return node;
		};
		return visit(tree, 'code', visitor);
	};
}

function plugin(className: MaybeString) {
	return transformer.bind(null, className);
}

export default plugin;
