import { hasFileExtension } from '@astrojs/internal-helpers/path';
import type { GetStaticPathsItem } from '../../types/public/common.js';
import type { AstroConfig } from '../../types/public/index.js';
import type { RouteData } from '../../types/public/internal.js';
import { trimSlashes } from '../path.js';
import { getRouteGenerator } from './generator.js';
import { validateGetStaticPathsParameter } from './internal/validation.js';

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
	// Endpoint routes with file extensions (e.g. [slug].png.ts) should never
	// append a trailing slash, matching the pattern generated in create-manifest.ts
	// by trailingSlashForPath(). Without this, the generated path (e.g. /og/foo.png/)
	// won't match the route pattern (e.g. /^\/og\/(.*?)\.png$/) and getParams() fails.
	if (route.type === 'endpoint' && hasFileExtension(route.route)) {
		trailingSlash = 'never';
	}

	// validate parameter values then stringify each value
	const validatedParams: Record<string, string> = {};
	for (const [key, value] of Object.entries(params)) {
		validateGetStaticPathsParameter([key, value], route.component);
		if (value !== undefined) {
			validatedParams[key] = trimSlashes(value);
		}
	}

	return getRouteGenerator(route.segments, trailingSlash)(validatedParams);
}
