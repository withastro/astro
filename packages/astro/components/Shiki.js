import { getHighlighter as getShikiHighlighter } from 'shiki';

// Caches Promise<Highligher> for reuse when the same theme and langs are provided
const _resolvedHighlighters = new Map();

function stringify(opts) {
	// Always sort keys before stringifying to make sure objects match regardless of parameter ordering
	return JSON.stringify(opts, Object.keys(opts).sort());
}

export function getHighlighter(opts) {
	const key = stringify(opts);

	// Highlighter has already been requested, reuse the same instance
	if (_resolvedHighlighters.has(key)) {
		return _resolvedHighlighters.get(key);
	}

	// Start the async getHighlighter call and cache the Promise
	const highlighter = getShikiHighlighter(opts);
	_resolvedHighlighters.set(key, highlighter);

	return highlighter;
}
