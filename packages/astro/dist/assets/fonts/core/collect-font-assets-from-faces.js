import { FONT_FORMATS } from '../constants.js';
import { renderFontWeight } from '../utils.js';
function collectFontAssetsFromFaces({
	fonts,
	fontFileIdGenerator,
	family,
	fontFilesIds,
	collectedFontsIds,
	hasher,
	defaults,
}) {
	const fontFileById = /* @__PURE__ */ new Map();
	const collectedFontsForMetricsByUniqueKey = /* @__PURE__ */ new Map();
	const preloads = [];
	for (const font of fonts) {
		let index = 0;
		for (const source of font.src) {
			if ('name' in source) {
				continue;
			}
			const format = FONT_FORMATS.find((e) => e.format === source.format);
			const originalUrl = source.originalURL;
			const id = fontFileIdGenerator.generate({
				cssVariable: family.cssVariable,
				font,
				originalUrl,
				type: format.type,
			});
			if (!fontFilesIds.has(id) && !fontFileById.has(id)) {
				fontFileById.set(id, { url: originalUrl, init: font.meta?.init });
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
			const collected = {
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
				fallbacks.length > 0 && // If the same data has already been sent for this family, we don't want to have
				// duplicated fallbacks. Such scenario can occur with unicode ranges.
				!collectedFontsIds.has(collectedKey) &&
				!collectedFontsForMetricsByUniqueKey.has(collectedKey)
			) {
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
export { collectFontAssetsFromFaces };
