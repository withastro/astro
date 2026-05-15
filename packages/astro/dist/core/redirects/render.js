import { PipelineFeatures } from '../base-pipeline.js';
import { getRouteGenerator } from '../routing/generator.js';
function isExternalURL(url) {
	return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}
function redirectIsExternal(redirect) {
	if (typeof redirect === 'string') {
		return isExternalURL(redirect);
	} else {
		return isExternalURL(redirect.destination);
	}
}
function computeRedirectStatus(method, redirect, redirectRoute) {
	return redirectRoute && typeof redirect === 'object'
		? redirect.status
		: method === 'GET'
			? 301
			: 308;
}
function resolveRedirectTarget(params, redirect, redirectRoute, trailingSlash) {
	if (typeof redirectRoute !== 'undefined') {
		const generate = getRouteGenerator(redirectRoute.segments, trailingSlash);
		return generate(params) || redirectRoute?.pathname || '/';
	} else if (typeof redirect === 'string') {
		if (redirectIsExternal(redirect)) {
			return redirect;
		} else {
			let target = redirect;
			for (const param of Object.keys(params)) {
				const paramValue = params[param];
				target = target.replace(`[${param}]`, paramValue).replace(`[...${param}]`, paramValue);
			}
			return target;
		}
	} else if (typeof redirect === 'undefined') {
		return '/';
	}
	return redirect.destination;
}
async function renderRedirect(state) {
	state.pipeline.usedFeatures |= PipelineFeatures.redirects;
	const routeData = state.routeData;
	const { redirect, redirectRoute } = routeData;
	const status = computeRedirectStatus(state.request.method, redirect, redirectRoute);
	const headers = {
		location: encodeURI(
			resolveRedirectTarget(
				state.params,
				redirect,
				redirectRoute,
				state.pipeline.manifest.trailingSlash,
			),
		),
	};
	if (redirect && redirectIsExternal(redirect)) {
		if (typeof redirect === 'string') {
			return Response.redirect(redirect, status);
		} else {
			return Response.redirect(redirect.destination, status);
		}
	}
	return new Response(null, { status, headers });
}
export { computeRedirectStatus, redirectIsExternal, renderRedirect, resolveRedirectTarget };
