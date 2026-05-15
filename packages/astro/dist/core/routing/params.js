import { trimSlashes } from '../path.js';
import { getRouteGenerator } from './generator.js';
import { validateGetStaticPathsParameter } from './internal/validation.js';
function stringifyParams(params, route, trailingSlash) {
	const validatedParams = {};
	for (const [key, value] of Object.entries(params)) {
		validateGetStaticPathsParameter([key, value], route.component);
		if (value !== void 0) {
			validatedParams[key] = trimSlashes(value);
		}
	}
	return getRouteGenerator(route.segments, trailingSlash)(validatedParams);
}
export { stringifyParams };
