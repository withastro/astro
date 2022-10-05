import type { APIContext, EndpointHandler, Params } from '../../@types/astro';
import type { RenderOptions } from '../render/core';

import { renderEndpoint } from '../../runtime/server/index.js';
import { AstroCookies, attachToResponse } from '../cookies/index.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../render/core.js';
import { ASTRO_VERSION } from '../util.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

export type EndpointOptions = Pick<
	RenderOptions,
	| 'logging'
	| 'origin'
	| 'request'
	| 'route'
	| 'routeCache'
	| 'pathname'
	| 'route'
	| 'site'
	| 'ssr'
	| 'status'
	| 'adapterName'
>;

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
						`Astro.clientAddress is not available in the ${args.adapterName} adapter. File an issue with the adapter to add support.`
					);
				} else {
					throw new Error(
						`Astro.clientAddress is not available in your environment. Ensure that you are using an SSR adapter that supports this feature.`
					);
				}
			}

			return Reflect.get(request, clientAddressSymbol);
		},
	};
}

export async function call(
	mod: EndpointHandler,
	opts: EndpointOptions
): Promise<EndpointCallResult> {
	const paramsAndPropsResp = await getParamsAndProps({ ...opts, mod: mod as any });

	if (paramsAndPropsResp === GetParamsAndPropsError.NoMatchingStaticPath) {
		throw new Error(
			`[getStaticPath] route pattern matched, but no matching static path found. (${opts.pathname})`
		);
	}
	const [params, props] = paramsAndPropsResp;

	const context = createAPIContext({
		request: opts.request,
		params,
		props,
		site: opts.site,
		adapterName: opts.adapterName,
	});
	const response = await renderEndpoint(mod, context, opts.ssr);

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
