import type { GetStaticPathsItem } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { trimSlashes } from '../path.js';
import { validateGetStaticPathsParameter } from './validation.js';

/**
 * given a route's Params object, validate parameter
 * values and create a stringified key for the route
 * that can be used to match request routes
 */
export function stringifyParams(params: GetStaticPathsItem['params'], route: RouteData) {
	// validate parameter values then stringify each value
	const validatedParams: Record<string, string> = {};
	for (const [key, value] of Object.entries(params)) {
		validateGetStaticPathsParameter([key, value], route.component);
		if (value !== undefined) {
			validatedParams[key] = trimSlashes(value);
		}
	}
	return route.generate(validatedParams);
}
