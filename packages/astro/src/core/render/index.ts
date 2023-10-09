import type { AstroMiddlewareInstance, ComponentInstance, RouteData } from '../../@types/astro.js';
import type { Environment } from './environment.js';

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
