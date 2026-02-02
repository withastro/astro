import type { Hasher } from '../definitions.js';
import type { FontFamily, ResolvedFontFamily } from '../types.js';
import { dedupe, withoutQuotes } from '../utils.js';

export function resolveFamily({
	family,
	hasher,
}: {
	family: FontFamily;
	hasher: Hasher;
}): ResolvedFontFamily {
	// We remove quotes from the name so they can be properly resolved by providers.
	const name = withoutQuotes(family.name);

	return {
		...family,
		name,
		// This will be used in CSS font faces. Quotes are added by the CSS renderer if
		// this value contains a space.
		uniqueName: `${name}-${hasher.hashObject(family)}`,
		weights: family.weights ? dedupe(family.weights.map((weight) => weight.toString())) : undefined,
		styles: family.styles ? dedupe(family.styles) : undefined,
		subsets: family.subsets ? dedupe(family.subsets) : undefined,
		formats: family.formats ? dedupe(family.formats) : undefined,
		fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		unicodeRange: family.unicodeRange ? dedupe(family.unicodeRange) : undefined,
	};
}
