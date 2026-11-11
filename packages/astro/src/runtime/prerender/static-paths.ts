// NOTE: Although this entrypoint is exported, it is internal API and may change at any time.

import type { CollectPrerenderMetadataOptions } from '@astrojs/runtime/_internal/core/render-scope/collect.js';
import type { StaticImageRecord } from '@astrojs/runtime/_internal/core/render-scope/scope.js';
import type { StaticPathsResult } from '@astrojs/vite-plugin-router';
import { StaticPaths as RouterStaticPaths } from '@astrojs/vite-plugin-router/_internal/runtime/prerender/static-paths.js';
import type { SerializedStaticImage } from '../../assets/types.js';

export * from '@astrojs/vite-plugin-router/_internal/runtime/prerender/static-paths.js';

/** `StaticPaths` whose collected images default to Astro's image transforms. */
export class StaticPaths extends RouterStaticPaths {
	override getAllWithMetadata<TImage extends StaticImageRecord = SerializedStaticImage>(
		options?: CollectPrerenderMetadataOptions,
	): Promise<StaticPathsResult<TImage>> {
		return super.getAllWithMetadata<TImage>(options);
	}
}
