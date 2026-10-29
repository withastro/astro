import type { ComponentAssets } from '@astrojs/runtime';

export type { ComponentAssets } from '@astrojs/runtime';

/** Build output: assets of every component compiled into the server build. */
export interface ComponentAssetsManifest {
	components: Record<string, ComponentAssets>;
	/** URLs shared by all components (renderer client entrypoints, islands, scripts). */
	resolve: Record<string, string>;
}
