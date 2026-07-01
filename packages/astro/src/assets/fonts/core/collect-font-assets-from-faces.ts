import type * as unifont from 'unifont';
import { FONT_FORMATS } from '../constants.js';
import type { FontFileIdGenerator, Hasher } from '../definitions.js';
import type { Defaults, FontFileById, PreloadData, ResolvedFontFamily } from '../types.js';
import { renderFontWeight } from '../utils.js';
import type { CollectedFontForMetrics } from './optimize-fallbacks.js';

export function collectFontAssetsFromFaces({
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
}) {
	const fontFileById: FontFileById = new Map();
	const collectedFontsForMetricsByUniqueKey = new Map<string, CollectedFontForMetrics>();
	const preloads: Array<PreloadData> = [];

	for (const font of fonts) {
		// The index keeps track of encountered URLs. We can't use a regular for loop
		// below because it may contain sources without urls, which would prevent preloading completely
		let index = 0;
		for (const source of font.src) {
			if ('name' in source) {
				continue;
			}
			const format = FONT_FORMATS.find((e) => e.format === source.format)!;
			const originalUrl = source.originalURL!;
			const id = fontFileIdGenerator.generate({
				cssVariable: family.cssVariable,
				font,
				originalUrl,
				type: format.type,
			});

			if (!fontFilesIds.has(id) && !fontFileById.has(id)) {
				fontFileById.set(id, { url: originalUrl, init: font.meta?.init });
				// We only collect the first URL to avoid preloading fallback sources (eg. we only
				// preload woff2 if woff is available)
				if (index === 0) {
					preloads.push({
						style: font.style,
						subset: font.meta?.subset,
						type: format.type,
						url: source.url,
						weight: renderFontWeight(font.weight),
					});
				}
			}

			const collected: CollectedFontForMetrics = {
				id,
				url: originalUrl,
				init: font.meta?.init,
				data: {
					weight: font.weight,
					style: font.style,
					meta: {
						subset: font.meta?.subset,
					},
				},
			};
			const collectedKey = hasher.hashObject(collected.data);
			const fallbacks = family.fallbacks ?? defaults.fallbacks;
			if (
				fallbacks.length > 0 &&
				// If the same data has already been sent for this family, we don't want to have
				// duplicated fallbacks. Such scenario can occur with unicode ranges.
				!collectedFontsIds.has(collectedKey) &&
				!collectedFontsForMetricsByUniqueKey.has(collectedKey)
			) {
				// If a family has fallbacks, we store the first url we get that may
				// be used for the fallback generation.
				collectedFontsForMetricsByUniqueKey.set(collectedKey, collected);
			}

			index++;
		}
	}

	return {
		fontFileById,
		preloads,
		collectedFontsForMetricsByUniqueKey,
	};
}
