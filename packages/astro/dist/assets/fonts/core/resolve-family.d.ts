import type { Hasher } from '../definitions.js';
import type { FontFamily, ResolvedFontFamily } from '../types.js';
export declare function resolveFamily({
	family,
	hasher,
}: {
	family: FontFamily;
	hasher: Hasher;
}): ResolvedFontFamily;
