import { getHighlighter as getShikiHighlighter } from 'shiki';
import { themes } from './shiki-themes.js';
import { languages } from './shiki-languages.js';

// Caches Promise<Highlighter> for reuse when the same theme and langs are provided
const _resolvedHighlighters = new Map();

/** @type {Promise<any>} */
let _allLanguages;

function stringify(opts) {
	// Always sort keys before stringifying to make sure objects match regardless of parameter ordering
	return JSON.stringify(opts, Object.keys(opts).sort());
}

/**
 * @param {import('shiki').HighlighterOptions} opts
 * @returns {Promise<import('shiki').HighlighterOptions>}
 */
export async function resolveHighlighterOptions(opts) {
	const resolvedThemes = [];
	if (opts.theme && opts.theme in themes) {
		resolvedThemes.push(await themes[opts.theme]());
	} else if (Object.keys(opts.theme).length) {
		resolvedThemes.push(opts.theme);
	}

	let resolvedLanguages;
	if (opts.langs) {
		resolvedLanguages = opts.langs;
	} else {
		if (!_allLanguages) {
			_allLanguages = (await Promise.all(Object.values(languages).map((fn) => fn()))).filter(
				Boolean
			);
		}
		resolvedLanguages = await _allLanguages;
	}

	/** @type {import('shiki').HighlighterOptions} */
	const highlighterOptions = {
		...opts,
		themes: resolvedThemes,
		langs: resolvedLanguages,
	};

	// Do not pass through the theme as that will attempt to load it, even if it's included in themes
	delete highlighterOptions['theme'];

	return highlighterOptions;
}

/**
 * @param {import('shiki').HighlighterOptions} opts
 * @returns {Promise<import('shiki').Highlighter>}
 */
async function resolveHighlighter(opts) {
	const highlighterOptions = await resolveHighlighterOptions(opts);

	// Start the async getHighlighter call and cache the Promise
	const highlighter = getShikiHighlighter(highlighterOptions).then((hl) => {
		hl.setColorReplacements({
			'#000001': 'var(--astro-code-color-text)',
			'#000002': 'var(--astro-code-color-background)',
			'#000004': 'var(--astro-code-token-constant)',
			'#000005': 'var(--astro-code-token-string)',
			'#000006': 'var(--astro-code-token-comment)',
			'#000007': 'var(--astro-code-token-keyword)',
			'#000008': 'var(--astro-code-token-parameter)',
			'#000009': 'var(--astro-code-token-function)',
			'#000010': 'var(--astro-code-token-string-expression)',
			'#000011': 'var(--astro-code-token-punctuation)',
			'#000012': 'var(--astro-code-token-link)',
		});
		return hl;
	});

	return highlighter;
}

/**
 * @param {import('shiki').HighlighterOptions} opts
 * @returns {Promise<import('shiki').Highlighter>}
 */
export function getHighlighter(opts) {
	const key = stringify(opts);

	// Highlighter has already been requested, reuse the same instance
	if (_resolvedHighlighters.has(key)) {
		return _resolvedHighlighters.get(key);
	}

	const highlighter = resolveHighlighter(opts);
	_resolvedHighlighters.set(key, highlighter);

	return highlighter;
}
