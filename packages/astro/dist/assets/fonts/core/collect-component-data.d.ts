import type { CssRenderer } from '../definitions.js';
import type {
	Collaborator,
	ComponentDataByCssVariable,
	Defaults,
	FontFamilyAssets,
} from '../types.js';
import type { optimizeFallbacks as _optimizeFallbacks } from './optimize-fallbacks.js';
export declare function collectComponentData({
	fontFamilyAssets,
	cssRenderer,
	defaults,
	optimizeFallbacks,
}: {
	fontFamilyAssets: Array<FontFamilyAssets>;
	cssRenderer: CssRenderer;
	defaults: Pick<Defaults, 'fallbacks' | 'optimizedFallbacks'>;
	optimizeFallbacks: Collaborator<
		typeof _optimizeFallbacks,
		'family' | 'fallbacks' | 'collectedFonts'
	>;
}): Promise<ComponentDataByCssVariable>;
