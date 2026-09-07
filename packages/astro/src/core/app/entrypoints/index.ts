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
	type RenderCollectors,
	type RenderCollectorScope,
} from '../../render-scope/scope.js';
export { recordStaticImage } from '../../render-scope/record.js';
export {
	collectPrerenderMetadata,
	type CollectedPrerenderMetadata,
} from '../../render-scope/collect.js';
export {
	renderForPrerender,
	type PrerenderableApp,
	type PrerenderRenderOptions,
} from '../prerender.js';
