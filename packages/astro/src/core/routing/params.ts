import type { GetStaticPathsItem, Params } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import { trimSlashes } from '../path.js';
import { getRouteGenerator } from './manifest/generator.js';
import { validateGetStaticPathsParameter } from './validation.js';

/**
 * given a route's Params object, validate parameter
 * values and create a stringified key for the route
 * that can be used to match request routes
 */
export function stringifyParams(
	params: GetStaticPathsItem['params'],
	route: RouteData,
	trailingSlash: AstroConfig['trailingSlash'],
) {
	// validate parameter values then stringify each value
	const validatedParams = Object.entries(params).reduce((acc, next) => {
		validateGetStaticPathsParameter(next, route.component);
		const [key, value] = next;
		if (value !== undefined) {
			acc[key] = trimSlashes(value);
		}
		return acc;
	}, {} as Params);

	return getRouteGenerator(route.segments, trailingSlash)(validatedParams);
}
