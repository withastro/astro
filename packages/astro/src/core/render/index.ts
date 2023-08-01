import type { AstroMiddlewareInstance, ComponentInstance, RouteData } from '../../@types/astro';
import type { DevelopmentEnvironment } from './environment';

export { createRenderContext } from './context.js';
export type { RenderContext } from './context.js';
export { tryRenderRoute } from './core.js';
export type { Environment } from './environment';
export { createEnvironment } from './environment.js';
export { getParamsAndProps } from './params-and-props.js';
export { loadRenderer, loadRenderers } from './renderer.js';
export type { DevelopmentEnvironment };

export interface SSROptions {
	/** The environment instance */
	env: DevelopmentEnvironment;
	/** location of file on disk */
	filePath: URL;
	/** the web request (needed for dynamic routes) */
	pathname: string;
	/** The runtime component instance */
	preload: ComponentInstance;
	/** Request */
	request: Request;
	/** optional, in case we need to render something outside of a dev server */
	route?: RouteData;
	/**
	 * Optional middlewares
	 */
	middleware?: AstroMiddlewareInstance<unknown>;
}
