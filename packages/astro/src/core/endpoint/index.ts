import type { APIContext, EndpointHandler, Params } from '../../@types/astro';
import type { Environment, RenderContext } from '../render/index';

import { renderEndpoint } from '../../runtime/server/index.js';
import { ASTRO_VERSION } from '../constants.js';
import { AstroCookies, attachToResponse } from '../cookies/index.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../render/core.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

type EndpointCallResult =
	| {
			type: 'simple';
			body: string;
			encoding?: BufferEncoding;
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
					throw new Error(
						`clientAddress is not available in the ${adapterName} adapter. File an issue with the adapter to add support.`
					);
				} else {
					throw new Error(
						`clientAddress is not available in your environment. Ensure that you are using an SSR adapter that supports this feature.`
					);
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
		throw new Error(
			`[getStaticPath] route pattern matched, but no matching static path found. (${ctx.pathname})`
		);
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
	};
}
