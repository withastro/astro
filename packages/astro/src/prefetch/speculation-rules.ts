/**
 * Generates static speculation rules JSON using `"source": "document"` with CSS selector matching.
 * This produces a deterministic payload that can be hashed at build time for CSP compatibility,
 * unlike the dynamic per-URL `"source": "list"` approach in `appendSpeculationRules()`.
 */
export function generateSpeculationRulesContent(prefetchAll: boolean): string {
	const selector = prefetchAll ? 'a' : 'a[data-astro-prefetch]';
	return JSON.stringify({
		prerender: [
			{
				source: 'document',
				where: { selector_matches: selector },
				eagerness: 'moderate',
			},
		],
		prefetch: [
			{
				source: 'document',
				where: { selector_matches: selector },
				eagerness: 'moderate',
			},
		],
	});
}
