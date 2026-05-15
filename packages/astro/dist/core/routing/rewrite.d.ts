import type { RewritePayload } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
type FindRouteToRewrite = {
	payload: RewritePayload;
	routes: RouteData[];
	request: Request;
	trailingSlash: AstroConfig['trailingSlash'];
	buildFormat: AstroConfig['build']['format'];
	base: AstroConfig['base'];
	outDir: URL | string;
};
interface FindRouteToRewriteResult {
	routeData: RouteData;
	newUrl: URL;
	pathname: string;
}
/**
 * Shared logic to retrieve the rewritten route. It returns a tuple that represents:
 * 1. The new `Request` object. It contains `base`
 * 2.
 */
export declare function findRouteToRewrite({
	payload,
	routes,
	request,
	trailingSlash,
	buildFormat,
	base,
	outDir,
}: FindRouteToRewrite): FindRouteToRewriteResult;
/**
 * Utility function that creates a new `Request` with a new URL from an old `Request`.
 *
 * @param newUrl The new `URL`
 * @param oldRequest The old `Request`
 * @param isPrerendered It needs to be the flag of the previous routeData, before the rewrite
 * @param logger
 * @param routePattern
 */
export declare function copyRequest(
	newUrl: URL,
	oldRequest: Request,
	isPrerendered: boolean,
	logger: AstroLogger,
	routePattern: string,
): Request;
export declare function setOriginPathname(
	request: Request,
	pathname: string,
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format'],
): void;
export declare function getOriginPathname(request: Request): string;
/**
 * Pure function that normalizes a rewrite target pathname by stripping the base,
 * handling trailing slashes, removing `.html` suffixes, and computing the final
 * full URL pathname (with base re-prepended).
 */
export declare function normalizeRewritePathname(
	urlPathname: string,
	base: AstroConfig['base'],
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format'],
): {
	pathname: string;
	resolvedUrlPathname: string;
};
export {};
