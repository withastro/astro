import type { APIContext, EndpointHandler, Params } from '../../@types/astro';
import { warn, type LogOptions } from '../../core/logger/core.js';

function getHandlerFromModule(mod: EndpointHandler, method: string, logging: LogOptions) {
	const lowerCaseMethod = method.toLowerCase();

	// TODO: remove in Astro 4.0
	if (mod[lowerCaseMethod]) {
		warn(
			logging,
			'astro',
			`Lower case endpoint names are deprecated and will not be supported in Astro 4.0. Rename the endpoint ${lowerCaseMethod} to ${method}.`
		);
	}
	// If there was an exact match on `method`, return that function.
	if (mod[method]) {
		return mod[method];
	}

	// TODO: remove in Astro 4.0
	if (mod[lowerCaseMethod]) {
		return mod[lowerCaseMethod];
	}
	// TODO: remove in Astro 4.0
	// Handle `del` instead of `delete`, since `delete` is a reserved word in JS.
	if (method === 'delete' && mod['del']) {
		return mod['del'];
	}
	// TODO: remove in Astro 4.0
	// If a single `all` handler was used, return that function.
	if (mod['all']) {
		return mod['all'];
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
	logging: LogOptions
) {
	const { request } = context;

	const chosenMethod = request.method?.toUpperCase();
	const handler = getHandlerFromModule(mod, chosenMethod, logging);
	// TODO: remove the 'get' check in Astro 4.0
	if (!ssr && ssr === false && chosenMethod && chosenMethod !== 'GET' && chosenMethod !== 'get') {
		// eslint-disable-next-line no-console
		console.warn(`
${chosenMethod} requests are not available when building a static site. Update your config to \`output: 'server'\` or \`output: 'hybrid'\` with an \`export const prerender = false\` to handle ${chosenMethod} requests.`);
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
