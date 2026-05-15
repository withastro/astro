import { runHookRouteSetup } from '../../integrations/hooks.js';
import { getPrerenderDefault } from '../../prerender/utils.js';
const PRERENDER_REGEX = /^\s*export\s+const\s+prerender\s*=\s*(true|false);?/m;
function parsePrerenderExport(content) {
	const match = PRERENDER_REGEX.exec(content);
	if (!match) return void 0;
	return match[1] === 'true';
}
async function getRoutePrerenderOption(content, route, settings, logger) {
	const match = PRERENDER_REGEX.exec(content);
	if (match) {
		route.prerender = match[1] === 'true';
		if (route.redirectRoute) {
			route.redirectRoute.prerender = match[1] === 'true';
		}
	}
	await runHookRouteSetup({ route, settings, logger });
	if (typeof route.prerender === void 0) {
		route.prerender = getPrerenderDefault(settings.config);
	}
	if (!route.prerender) settings.buildOutput = 'server';
}
export { getRoutePrerenderOption, parsePrerenderExport };
