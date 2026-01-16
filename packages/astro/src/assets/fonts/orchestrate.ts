import { collectComponentData } from './core/collect-component-data.js';
import { collectFontData } from './core/collect-font-data.js';
import type { computeFontFamiliesAssets as _computeFontFamiliesAssets } from './core/compute-font-families-assets.js';
import { optimizeFallbacks } from './core/optimize-fallbacks.js';
import { resolveFamily } from './core/resolve-family.js';
import type {
	CssRenderer,
	FontMetricsResolver,
	Hasher,
	SystemFallbacksProvider,
} from './definitions.js';
import type {
	Collaborator,
	ComponentDataByCssVariable,
	Defaults,
	FontDataByCssVariable,
	FontFamily,
	FontFileById,
} from './types.js';

// TODO: inline in vite plugin
export async function orchestrate({
	families,
	hasher,
	cssRenderer,
	systemFallbacksProvider,
	fontMetricsResolver,
	defaults,
	computeFontFamiliesAssets,
}: {
	families: Array<FontFamily>;
	hasher: Hasher;
	cssRenderer: CssRenderer;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
	defaults: Defaults;
	computeFontFamiliesAssets: Collaborator<
		typeof _computeFontFamiliesAssets,
		'resolvedFamilies' | 'defaults'
	>;
}): Promise<{
	fontFileById: FontFileById;
	componentDataByCssVariable: ComponentDataByCssVariable;
	fontDataByCssVariable: FontDataByCssVariable;
}> {
	const resolvedFamilies = families.map((family) => resolveFamily({ family, hasher }));
	// TODO: return array, keep map as internal detail if possible
	const { fontFamilyAssetsByUniqueKey, fontFileById } = await computeFontFamiliesAssets({
		resolvedFamilies,
		defaults,
	});
	const fontFamilyAssets = Array.from(fontFamilyAssetsByUniqueKey.values());
	const { fontDataByCssVariable } = collectFontData(fontFamilyAssets);
	const { componentDataByCssVariable } = await collectComponentData({
		cssRenderer,
		defaults,
		fontFamilyAssets,
		optimizeFallbacks: ({ collectedFonts, fallbacks, family }) =>
			optimizeFallbacks({
				collectedFonts,
				fallbacks,
				family,
				fontMetricsResolver,
				systemFallbacksProvider,
			}),
	});

	return { fontFileById, componentDataByCssVariable, fontDataByCssVariable };
}
