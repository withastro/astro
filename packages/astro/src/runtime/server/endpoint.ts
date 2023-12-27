import { bold } from 'kleur/colors';
import type { APIContext, EndpointHandler, Params } from '../../@types/astro.js';
import type { Logger } from '../../core/logger/core.js';

/** Renders an endpoint request to completion, returning the body. */
export async function renderEndpoint(
	mod: EndpointHandler,
	context: APIContext,
	ssr: boolean,
	logger: Logger
) {
	const { request, url } = context;

	const method = request.method.toUpperCase();
	// use the exact match on `method`, fallback to ALL
	const handler = mod[method] ?? mod['ALL'];
	if (!ssr && ssr === false && method !== 'GET') {
		logger.warn(
			'router',
			`${url.pathname} ${bold(
				method
			)} requests are not available for a static site. Update your config to \`output: 'server'\` or \`output: 'hybrid'\` to enable.`
		);
	}
	if (typeof handler !== 'function') {
		logger.warn(
			'router',
			`No API Route handler exists for the method "${method}" for the route ${url.pathname}.\n` +
				`Found handlers: ${Object.keys(mod)
					.map((exp) => JSON.stringify(exp))
					.join(', ')}\n` +
				('all' in mod
					? `One of the exported handlers is "all" (lowercase), did you mean to export 'ALL'?\n`
					: '')
		);
		// No handler found, so this should be a 404. Using a custom header
		// to signal to the renderer that this is an internal 404 that should
		// be handled by a custom 404 route if possible.
		return new Response(null, {
			status: 404,
			headers: {
				'X-Astro-Response': 'Not-Found',
			},
		});
	}

	return handler.call(mod, context);
}
