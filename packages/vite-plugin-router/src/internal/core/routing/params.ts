import type { TrailingSlash } from '../../../index.js';
import { hasFileExtension } from '@astrojs/internal-helpers/path';
import type { GetStaticPathsItem } from '../../../index.js';
import type { RouteData } from '../../../index.js';
import { trimSlashes } from '@astrojs/internal-helpers/path';
import { getRouteGenerator } from './generator.js';
import { validateGetStaticPathsParameter } from '../../../core/routing/internal/validation.js';

/**
 * given a route's Params object, validate parameter
 * values and create a stringified key for the route
 * that can be used to match request routes
 */
export function stringifyParams(
	params: GetStaticPathsItem['params'],
	route: RouteData,
	trailingSlash: TrailingSlash,
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
