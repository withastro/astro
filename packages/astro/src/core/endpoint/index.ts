import type {
	APIContext,
	AstroConfig,
	EndpointHandler,
	EndpointOutput,
	MiddlewareEndpointHandler,
	MiddlewareHandler,
	Params,
} from '../../@types/astro';
import type { Environment, RenderContext } from '../render/index';

import mime from 'mime';
import { isServerLikeOutput } from '../../prerender/utils.js';
import { renderEndpoint } from '../../runtime/server/index.js';
import { ASTRO_VERSION } from '../constants.js';
import { AstroCookies, attachToResponse } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { warn } from '../logger/core.js';
import { callMiddleware } from '../middleware/callMiddleware.js';

const encoder = new TextEncoder();

const clientAddressSymbol = Symbol.for('astro.clientAddress');
const clientLocalsSymbol = Symbol.for('astro.locals');

type SimpleEndpointObject = {
	body: string;
	encoding?: BufferEncoding;
};

type CreateAPIContext = {
	request: Request;
	params: Params;
	site?: string;
	props: Record<string, any>;
	adapterName?: string;
};

/**
 * Creates a context that holds all the information needed to handle an Astro endpoint.
 *
 * @param {CreateAPIContext} payload
 */
export function createAPIContext({
	request,
	params,
	site,
	props,
	adapterName,
}: CreateAPIContext): APIContext {
	const context = {
		cookies: new AstroCookies(request),
		request,
		params,
		site: site ? new URL(site) : undefined,
		generator: `Astro v${ASTRO_VERSION}`,
		props,
		redirect(path, status) {
			return new Response(null, {
				status: status || 302,
				headers: {
					Location: path,
				},
			});
		},
		url: new URL(request.url),
		get clientAddress() {
			if (!(clientAddressSymbol in request)) {
				if (adapterName) {
					throw new AstroError({
						...AstroErrorData.ClientAddressNotAvailable,
						message: AstroErrorData.ClientAddressNotAvailable.message(adapterName),
					});
				} else {
					throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
				}
			}

			return Reflect.get(request, clientAddressSymbol);
		},
	} as APIContext;

	// We define a custom property, so we can check the value passed to locals
	Object.defineProperty(context, 'locals', {
		enumerable: true,
		get() {
			return Reflect.get(request, clientLocalsSymbol);
		},
		set(val) {
			if (typeof val !== 'object') {
				throw new AstroError(AstroErrorData.LocalsNotAnObject);
			} else {
				Reflect.set(request, clientLocalsSymbol, val);
			}
		},
	});
	return context;
}

// Return response only
export async function callEndpoint<MiddlewareResult = Response | EndpointOutput>(
	mod: EndpointHandler,
	env: Environment,
	ctx: RenderContext,
	onRequest?: MiddlewareHandler<MiddlewareResult> | undefined
): Promise<Response>;
// Return response or a simple endpoint object (used for SSG)
export async function callEndpoint<MiddlewareResult = Response | EndpointOutput>(
	mod: EndpointHandler,
	env: Environment,
	ctx: RenderContext,
	onRequest?: MiddlewareHandler<MiddlewareResult> | undefined,
	returnObjectFormIfAvailable?: boolean
): Promise<Response | SimpleEndpointObject>;
// Base implementation
export async function callEndpoint<MiddlewareResult = Response | EndpointOutput>(
	mod: EndpointHandler,
	env: Environment,
	ctx: RenderContext,
	onRequest?: MiddlewareHandler<MiddlewareResult> | undefined,
	returnObjectFormIfAvailable?: boolean
): Promise<Response | SimpleEndpointObject> {
	const context = createAPIContext({
		request: ctx.request,
		params: ctx.params,
		props: ctx.props,
		site: env.site,
		adapterName: env.adapterName,
	});

	let response;
	if (onRequest) {
		response = await callMiddleware<Response | EndpointOutput>(
			env.logging,
			onRequest as MiddlewareEndpointHandler,
			context,
			async () => {
				return await renderEndpoint(mod, context, env.ssr);
			}
		);
	} else {
		response = await renderEndpoint(mod, context, env.ssr);
	}

	// If return simple endpoint object, convert to response
	if (!(response instanceof Response)) {
		// Validate properties not available in SSR
		if (env.ssr && !ctx.route?.prerender) {
			if (response.hasOwnProperty('headers')) {
				warn(
					env.logging,
					'ssr',
					'Setting headers is not supported when returning an object. Please return an instance of Response. See https://docs.astro.build/en/core-concepts/endpoints/#server-endpoints-api-routes for more information.'
				);
			}

			if (response.encoding) {
				warn(
					env.logging,
					'ssr',
					'`encoding` is ignored in SSR. To return a charset other than UTF-8, please return an instance of Response. See https://docs.astro.build/en/core-concepts/endpoints/#server-endpoints-api-routes for more information.'
				);
			}
		}

		// Passed during SSG where we don't need to return a full response, as we only need
		// to write the `body` to a file directly.
		if (returnObjectFormIfAvailable) {
			return {
				body: response.body,
				encoding: response.encoding,
			};
		}

		let body: BodyInit;
		const headers = new Headers();

		const pathname = ctx.route
			? // Try the static route `pathname`
			  ctx.route.pathname ??
			  // Dynamic routes don't include `pathname`, so synthesize a path for these (e.g. 'src/pages/[slug].svg')
			  ctx.route.segments.map((s) => s.map((p) => p.content).join('')).join('/')
			: // Fallback to pathname of the request
			  ctx.pathname;
		const mimeType = mime.getType(pathname) || 'text/plain';
		headers.set('Content-Type', `${mimeType};charset=utf-8`);

		if (typeof Buffer !== 'undefined' && Buffer.from) {
			body = Buffer.from(response.body, response.encoding);
		} else if (
			response.encoding == null ||
			response.encoding === 'utf8' ||
			response.encoding === 'utf-8'
		) {
			body = encoder.encode(response.body);
			headers.set('Content-Length', body.byteLength.toString());
		} else {
			body = response.body;
		}

		response = new Response(body, {
			status: 200,
			headers,
		});
	}

	attachToResponse(response, context.cookies);

	return response;
}

function isRedirect(statusCode: number) {
	return statusCode >= 300 && statusCode < 400;
}

export function throwIfRedirectNotAllowed(response: Response, config: AstroConfig) {
	if (
		!isServerLikeOutput(config) &&
		isRedirect(response.status) &&
		!config.experimental.redirects
	) {
		throw new AstroError(AstroErrorData.StaticRedirectNotAvailable);
	}
}
