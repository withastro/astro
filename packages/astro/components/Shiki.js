import { getHighlighter as getShikiHighlighter } from 'shiki';

// Caches Promise<Highligher> for reuse when the same theme and langs are provided
const _resolvedHighlighters = new Map();

function stringify(opts) {
	// Always sort keys before stringifying to make sure objects match regardless of parameter ordering
	return JSON.stringify(opts, Object.keys(opts).sort());
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

	// Start the async getHighlighter call and cache the Promise
	const highlighter = getShikiHighlighter(opts).then((hl) => {
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
	_resolvedHighlighters.set(key, highlighter);

	return highlighter;
}
