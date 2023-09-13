import type { AstroMiddlewareInstance, ComponentInstance, RouteData } from '../../@types/astro.js';
import type { Environment } from './environment.js';
export { createRenderContext } from './context.js';
export type { RenderContext } from './context.js';
export { tryRenderRoute } from './core.js';
export { createEnvironment } from './environment.js';
export { getParamsAndProps } from './params-and-props.js';
export { loadRenderer } from './renderer.js';

export type { Environment };

export interface SSROptions {
	/** The environment instance */
	env: Environment;
	/** location of file on disk */
	filePath: URL;
	/** the web request (needed for dynamic routes) */
	pathname: string;
	/** The runtime component instance */
	preload: ComponentInstance;
	/** Request */
	request: Request;
	/** optional, in case we need to render something outside of a dev server */
	route: RouteData;
	/**
	 * Optional middlewares
	 */
	middleware?: AstroMiddlewareInstance<unknown>;
}
