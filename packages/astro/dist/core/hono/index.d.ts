import { FetchState } from '../fetch/index.js';
export { FetchState };
export type { AstroFetchState } from '../fetch/index.js';
type HonoContextLike = {
	req: {
		raw: Request;
	};
	res: Response;
	get?: (key: string) => unknown;
	set?: (key: string, value: unknown) => void;
};
type HonoMiddlewareHandler = (
	context: HonoContextLike,
	next: () => Promise<void>,
) => Promise<Response | void>;
export declare function astro(): HonoMiddlewareHandler;
export declare function trailingSlash(): HonoMiddlewareHandler;
export declare function middleware(): HonoMiddlewareHandler;
export declare function redirects(): HonoMiddlewareHandler;
export declare function actions(): HonoMiddlewareHandler;
export declare function pages(): HonoMiddlewareHandler;
export declare function sessions(): HonoMiddlewareHandler;
export declare function cache(next: () => Promise<Response>): HonoMiddlewareHandler;
export declare function i18n(): HonoMiddlewareHandler;
