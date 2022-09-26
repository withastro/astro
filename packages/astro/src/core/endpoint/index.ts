import type { APIContext, EndpointHandler, Params } from '../../@types/astro';
import type { RenderOptions } from '../render/core';

import { AstroCookies, attachToResponse } from '../cookies/index.js';
import { renderEndpoint } from '../../runtime/server/index.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../render/core.js';

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

function createAPIContext(request: Request, params: Params): APIContext {
	return {
		cookies: new AstroCookies(request),
		request,
		params
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
	const [params] = paramsAndPropsResp;

	const context = createAPIContext(opts.request, params);
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
