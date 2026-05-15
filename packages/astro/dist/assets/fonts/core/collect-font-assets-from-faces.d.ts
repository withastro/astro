import type * as unifont from 'unifont';
import type { FontFileIdGenerator, Hasher } from '../definitions.js';
import type { Defaults, FontFileById, PreloadData, ResolvedFontFamily } from '../types.js';
import type { CollectedFontForMetrics } from './optimize-fallbacks.js';
export declare function collectFontAssetsFromFaces({
	fonts,
	fontFileIdGenerator,
	family,
	fontFilesIds,
	collectedFontsIds,
	hasher,
	defaults,
}: {
	fonts: Array<unifont.FontFaceData>;
	fontFileIdGenerator: FontFileIdGenerator;
	family: Pick<ResolvedFontFamily, 'cssVariable' | 'fallbacks'>;
	fontFilesIds: Set<string>;
	collectedFontsIds: Set<string>;
	hasher: Hasher;
	defaults: Pick<Defaults, 'fallbacks'>;
}): {
	fontFileById: FontFileById;
	preloads: PreloadData[];
	collectedFontsForMetricsByUniqueKey: Map<string, CollectedFontForMetrics>;
};
