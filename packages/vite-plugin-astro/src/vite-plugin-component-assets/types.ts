import type { SSRComponentMetadata, StylesheetAsset } from '../types.js';

/** What rendering one component tree needs from the build or the dev server. */
export interface ComponentAssets {
	/** Stylesheets of every module in the tree, in import order. */
	styles: StylesheetAsset[];
	/**
	 * URLs of island components, renderer client entrypoints and component scripts, keyed by the
	 * specifier the render runtime passes to `SSRResult.resolve()`.
	 */
	resolve: Record<string, string>;
	/** Head metadata of the `.astro` modules in the tree, for `SSRResult.componentMetadata`. */
	componentMetadata: [string, SSRComponentMetadata][];
}

/** Build output: assets of every component compiled into the server build. */
export interface ComponentAssetsManifest {
	components: Record<string, ComponentAssets>;
	/** URLs shared by all components (renderer client entrypoints, islands, scripts). */
	resolve: Record<string, string>;
}
