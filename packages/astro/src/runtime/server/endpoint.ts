import { bold } from 'kleur/colors';
import type { APIContext, EndpointHandler, Params } from '../../@types/astro.js';
import type { Logger } from '../../core/logger/core.js';

function getHandlerFromModule(mod: EndpointHandler, method: string) {
	// If there was an exact match on `method`, return that function.
	if (mod[method]) {
		return mod[method];
	}
	if (mod['ALL']) {
		return mod['ALL'];
	}
	// Otherwise, no handler found.
	return undefined;
}

/** Renders an endpoint request to completion, returning the body. */
export async function renderEndpoint(
	mod: EndpointHandler,
	context: APIContext,
	ssr: boolean,
	logger: Logger
) {
	const { request, url } = context;

	const chosenMethod = request.method?.toUpperCase();
	const handler = getHandlerFromModule(mod, chosenMethod);
	if (!ssr && ssr === false && chosenMethod && chosenMethod !== 'GET') {
		logger.warn(
			null,
			`${url.pathname} ${bold(
				chosenMethod
			)} requests are not available for a static site. Update your config to \`output: 'server'\` or \`output: 'hybrid'\` to enable.`
		);
	}
	if (!handler || typeof handler !== 'function') {
		// No handler found, so this should be a 404. Using a custom header
		// to signal to the renderer that this is an internal 404 that should
		// be handled by a custom 404 route if possible.
		let response = new Response(null, {
			status: 404,
			headers: {
				'X-Astro-Response': 'Not-Found',
			},
		});
		return response;
	}

	const proxy = new Proxy(context, {
		get(target, prop) {
			if (prop in target) {
				return Reflect.get(target, prop);
			} else {
				return undefined;
			}
		},
	}) as APIContext & Params;

	return handler.call(mod, proxy, request);
}
