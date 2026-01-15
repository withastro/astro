import type { Hasher } from '../definitions.js';
import type { FontFamily, ResolvedFontFamily } from '../types.js';
import { dedupe, withoutQuotes } from '../utils.js';

/**
 * Dedupes properties if applicable and resolves entrypoints.
 */
export function resolveFamily({
	family,
	hasher,
}: {
	family: FontFamily;
	hasher: Hasher;
}): ResolvedFontFamily {
	// We remove quotes from the name so they can be properly resolved by providers.
	const name = withoutQuotes(family.name);
	// This will be used in CSS font faces. Quotes are added by the CSS renderer if
	// this value contains a space.
	const nameWithHash = `${name}-${hasher.hashObject(family)}`;

	return {
		...family,
		name,
		nameWithHash,
		weights: family.weights ? dedupe(family.weights.map((weight) => weight.toString())) : undefined,
		styles: family.styles ? dedupe(family.styles) : undefined,
		subsets: family.subsets ? dedupe(family.subsets) : undefined,
		formats: family.formats ? dedupe(family.formats) : undefined,
		fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		unicodeRange: family.unicodeRange ? dedupe(family.unicodeRange) : undefined,
	};
}

/**
 * A function for convenience. The actual logic lives in resolveFamily
 */
export function resolveFamilies({
	families,
	...dependencies
}: { families: Array<FontFamily> } & Omit<
	Parameters<typeof resolveFamily>[0],
	'family'
>): Array<ResolvedFontFamily> {
	return families.map((family) =>
		resolveFamily({
			family,
			...dependencies,
		}),
	);
}
