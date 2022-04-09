import type { EndpointHandler } from '../../@types/astro';
import type { RenderOptions } from '../render/core';
import { renderEndpoint } from '../../runtime/server/index.js';
import { getParamsAndProps, GetParamsAndPropsError } from '../render/core.js';
import { runHookRenderPage } from '../../integrations/index.js';

export type EndpointOptions = Pick<
	RenderOptions,
	'logging' | 'origin' | 'request' | 'route' | 'routeCache' | 'pathname' | 'route' | 'site' |
		'ssr' | 'astroConfig'
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

	// Allow integrations to process and modify the rendered endpoint
	let html = response.body;
	html = await runHookRenderPage({
		config: opts.astroConfig,
		routeType: 'endpoint',
		pathname: opts.pathname,
		html
	});

	return {
		type: 'simple',
		body: html,
	};
}
