import type { Pipeline } from '../pipeline.js';

export async function renderRedirect(pipeline: Pipeline) {
	const { request: { method }, routeData } = pipeline;
	const { redirect, redirectRoute } = routeData;
	const status =
		redirectRoute && typeof redirect === "object" ? redirect.status
		: method === "GET" ? 301
		: 308
	const headers = { location: redirectRouteGenerate(pipeline) }; 
	return new Response(null, { status, headers });
}

function redirectRouteGenerate(pipeline: Pipeline): string {
	const { params, routeData: { redirect, redirectRoute } } = pipeline;

	if (typeof redirectRoute !== 'undefined') {
		return redirectRoute?.generate(params) || redirectRoute?.pathname || '/';
	} else if (typeof redirect === 'string') {
		// TODO: this logic is duplicated between here and manifest/create.ts
		let target = redirect;
		for (const param of Object.keys(params)) {
			const paramValue = params[param]!;
			target = target.replace(`[${param}]`, paramValue);
			target = target.replace(`[...${param}]`, paramValue);
		}
		return target;
	} else if (typeof redirect === 'undefined') {
		return '/';
	}
	return redirect.destination;
}
