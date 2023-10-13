import { type Highlighter, getHighlighter } from 'shikiji';

type HighlighterOptions = NonNullable<Parameters<typeof getHighlighter>[0]>;

const ASTRO_COLOR_REPLACEMENTS: Record<string, string> = {
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
};
const COLOR_REPLACEMENT_REGEX = new RegExp(
	`(${Object.keys(ASTRO_COLOR_REPLACEMENTS).join('|')})`,
	'g'
);

// Caches Promise<Highlighter> for reuse when the same theme and langs are provided
const cachedHighlighters = new Map();

/**
 * shiki -> shikiji compat as we need to manually replace it
 */
export function replaceCssVariables(str: string) {
	return str.replace(COLOR_REPLACEMENT_REGEX, (match) => ASTRO_COLOR_REPLACEMENTS[match] || match);
}

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
