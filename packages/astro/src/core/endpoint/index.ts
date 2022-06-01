import type { EndpointHandler } from '../../@types/astro';
import { renderEndpoint } from '../../runtime/server/index.js';
import type { RenderOptions } from '../render/core';
import { getParamsAndProps, GetParamsAndPropsError } from '../render/core.js';

export type EndpointOptions = Pick<
	RenderOptions,
	'logging' | 'origin' | 'request' | 'route' | 'routeCache' | 'pathname' | 'route' | 'site' | 'ssr'
>;

type EndpointCallResult =
	| {
			type: 'simple';
			body: string;
	  }
	| {
			type: 'response';
			response: Response;
	  };

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

	const response = await renderEndpoint(mod, opts.request, params);

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
