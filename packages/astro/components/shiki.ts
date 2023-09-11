import { type Highlighter, getHighlighter } from 'shikiji';

type HighlighterOptions = NonNullable<Parameters<typeof getHighlighter>[0]>;

// Caches Promise<Highlighter> for reuse when the same theme and langs are provided
const cachedHighlighters = new Map();

export function getCachedHighlighter(opts: HighlighterOptions): Promise<Highlighter> {
	// Always sort keys before stringifying to make sure objects match regardless of parameter ordering
	const key = JSON.stringify(opts, Object.keys(opts).sort());

	// Highlighter has already been requested, reuse the same instance
	if (cachedHighlighters.has(key)) {
		return cachedHighlighters.get(key);
	}

	const highlighter = getHighlighter(opts);
	cachedHighlighters.set(key, highlighter);

	return highlighter;
}
