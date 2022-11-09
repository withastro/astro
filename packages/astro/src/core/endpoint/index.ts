import type { APIContext, AstroConfig, EndpointHandler, Params } from '../../@types/astro';
import type { Environment, RenderContext } from '../render/index';

import { renderEndpoint } from '../../runtime/server/index.js';
import { ASTRO_VERSION } from '../constants.js';
import { AstroCookies, attachToResponse } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../render/core.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

type EndpointCallResult =
	| {
			type: 'simple';
			body: string;
			encoding?: BufferEncoding;
			cookies: AstroCookies;
	  }
	| {
			type: 'response';
			response: Response;
	  };

function createAPIContext({
	request,
	params,
	site,
	props,
	adapterName,
}: {
	request: Request;
	params: Params;
	site?: string;
	props: Record<string, any>;
	adapterName?: string;
}): APIContext {
	return {
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
						...AstroErrorData.SSRClientAddressNotAvailableInAdapter,
						message: AstroErrorData.SSRClientAddressNotAvailableInAdapter.message(adapterName),
					});
				} else {
					throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
				}
			}

			return Reflect.get(request, clientAddressSymbol);
		},
	};
}

export async function call(
	mod: EndpointHandler,
	env: Environment,
	ctx: RenderContext
): Promise<EndpointCallResult> {
	const paramsAndPropsResp = await getParamsAndProps({
		mod: mod as any,
		route: ctx.route,
		routeCache: env.routeCache,
		pathname: ctx.pathname,
		logging: env.logging,
		ssr: env.ssr,
	});

	if (paramsAndPropsResp === GetParamsAndPropsError.NoMatchingStaticPath) {
		throw new AstroError({
			...AstroErrorData.NoMatchingStaticPathFound,
			message: AstroErrorData.NoMatchingStaticPathFound.message(ctx.pathname),
			hint: ctx.route?.component
				? AstroErrorData.NoMatchingStaticPathFound.hint([ctx.route?.component])
				: '',
		});
	}
	const [params, props] = paramsAndPropsResp;

	const context = createAPIContext({
		request: ctx.request,
		params,
		props,
		site: env.site,
		adapterName: env.adapterName,
	});

	const response = await renderEndpoint(mod, context, env.ssr);

	if (response instanceof Response) {
		attachToResponse(response, context.cookies);
		return {
			type: 'response',
			response,
		};
	}

	return {
		type: 'simple',
		body: response.body,
		encoding: response.encoding,
		cookies: context.cookies,
	};
}

function isRedirect(statusCode: number) {
	return statusCode >= 300 && statusCode < 400;
}

export function throwIfRedirectNotAllowed(response: Response, config: AstroConfig) {
	if (config.output !== 'server' && isRedirect(response.status)) {
		throw new AstroError(AstroErrorData.StaticRedirectNotAllowed);
	}
}
