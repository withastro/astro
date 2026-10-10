import type { CollectedPrerenderMetadata as BaseCollectedPrerenderMetadata } from '@astrojs/vite-plugin-astro/internal/core/render-scope/collect.js';
import type {
	RenderCollectorScope as BaseRenderCollectorScope,
	RenderCollectors as BaseRenderCollectors,
} from '@astrojs/vite-plugin-astro/internal/core/render-scope/scope.js';
import type { SerializedStaticImage } from '../../../assets/types.js';

export type { RoutesList } from '../../../types/astro.js';
export { App } from '../app.js';
export {
	BaseApp,
	type RenderErrorOptions,
	type RenderOptions,
	type LogRequestPayload,
} from '../base.js';
export { fromRoutingStrategy, toRoutingStrategy } from '../common.js';
export { createConsoleLogger } from '../../logger/impls/console.js';
export {
	deserializeManifest,
	deserializeRouteData,
	deserializeRouteInfo,
	serializeRouteData,
	serializeRouteInfo,
} from '../manifest.js';
export {
	getInstalledRenderScope,
	installRenderScope,
} from '@astrojs/vite-plugin-astro/internal/core/render-scope/scope.js';
export type RenderCollectors = BaseRenderCollectors<SerializedStaticImage>;
export type RenderCollectorScope = BaseRenderCollectorScope<SerializedStaticImage>;
/** @deprecated `getImage()` records the images it resolves. */
export { recordStaticImage } from '@astrojs/vite-plugin-astro/internal/core/render-scope/record.js';
export {
	collectPrerenderMetadata,
	type CollectPrerenderMetadataOptions,
} from '@astrojs/vite-plugin-astro/internal/core/render-scope/collect.js';
export type CollectedPrerenderMetadata = BaseCollectedPrerenderMetadata<SerializedStaticImage>;
export {
	renderForPrerender,
	type PrerenderableApp,
	type PrerenderRenderOptions,
} from '../prerender.js';
