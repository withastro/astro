import type { EndpointHandler } from '../../@types/astro';
import type { RenderOptions } from '../render/core';
import { renderEndpoint } from '../../runtime/server/index.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../render/core.js';
import { createRequest } from '../render/request.js';

export type EndpointOptions = Pick<RenderOptions, 'logging' | 'headers' | 'method' | 'origin' | 'route' | 'routeCache' | 'pathname' | 'route' | 'site' | 'ssr'>;

type EndpointCallResult =
	| {
			type: 'simple';
			body: string;
	  }
	| {
			type: 'response';
			response: Response;
	  };

export async function call(mod: EndpointHandler, opts: EndpointOptions): Promise<EndpointCallResult> {
	const paramsAndPropsResp = await getParamsAndProps({ ...opts, mod: mod as any });

	if (paramsAndPropsResp === GetParamsAndPropsError.NoMatchingStaticPath) {
		throw new Error(`[getStaticPath] route pattern matched, but no matching static path found. (${opts.pathname})`);
	}
	const [params] = paramsAndPropsResp;
	const request = createRequest(opts.method, opts.pathname, opts.headers, opts.origin, opts.site, opts.ssr);

	const response = await renderEndpoint(mod, request, params);

	if (response instanceof Response) {
		return {
			type: 'response',
			response,
		};
	}

	return {
		type: 'simple',
		body: response.body,
	};
}
