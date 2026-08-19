import colors from 'piccolore';
import { REROUTABLE_STATUS_CODES } from '../../core/constants.js';
import { AstroError } from '../../core/errors/errors.js';
import { EndpointDidNotReturnAResponse } from '../../core/errors/errors-data.js';
import type { FetchState } from '../../core/fetch/fetch-state.js';
import type { AstroLogger } from '../../core/logger/core.js';
import type { APIRoute } from '../../types/public/common.js';
import type { APIContext } from '../../types/public/context.js';

/** Renders an endpoint request to completion, returning the body. */
export async function renderEndpoint(
	mod: {
		[method: string]: APIRoute;
	},
	context: APIContext,
	isPrerendered: boolean,
	logger: AstroLogger,
	state?: FetchState,
) {
	const { request, url } = context;

	const method = request.method.toUpperCase();
	// use the exact match on `method`, fall back to ALL
	let handler = mod[method] ?? mod['ALL'];
	// use GET handler for HEAD requests
	if (!handler && method === 'HEAD' && mod['GET']) {
		handler = mod['GET'];
	}
	if (isPrerendered && !['GET', 'HEAD'].includes(method)) {
		logger.warn(
			'router',
			`${url.pathname} ${colors.bold(
				method,
			)} requests are not available in static endpoints. Mark this page as server-rendered (\`export const prerender = false;\`) or update your config to \`output: 'server'\` to make all your pages server-rendered by default.`,
		);
	}
	if (handler === undefined) {
		logger.warn(
			'router',
			`No API Route handler exists for the method "${method}" for the route "${url.pathname}".\n` +
				`Found handlers: ${Object.keys(mod)
					.map((exp) => JSON.stringify(exp))
					.join(', ')}\n` +
				('all' in mod
					? `One of the exported handlers is "all" (lowercase), did you mean to export 'ALL'?\n`
					: ''),
		);
		// No handler matching the verb found, so this should be a
		// 404. Should be handled by 404.astro route if possible.
		return new Response(null, { status: 404 });
	}
	if (typeof handler !== 'function') {
		logger.error(
			'router',
			`The route "${
				url.pathname
			}" exports a value for the method "${method}", but it is of the type ${typeof handler} instead of a function.`,
		);
		return new Response(null, { status: 500 });
	}

	let response = await handler.call(mod, context);
	if (!response || response instanceof Response === false) {
		throw new AstroError(EndpointDidNotReturnAResponse);
	}

	// Endpoints explicitly returning 404 or 500 response status should
	// NOT be subject to rerouting to 404.astro or 500.astro.
	if (state && REROUTABLE_STATUS_CODES.includes(response.status)) {
		state.skipErrorReroute = true;
	}

	if (method === 'HEAD') {
		// make sure HEAD responses doesnt have body
		return new Response(null, response);
	}

	return response;
}
