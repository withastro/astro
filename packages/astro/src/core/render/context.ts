import type {
	ComponentInstance,
	Params,
	Props,
	RouteData,
	SSRElement,
	SSRResult,
} from '../../@types/astro';
import { getParamsAndPropsOrThrow } from './core.js';
import type { Environment } from './environment';

/**
 * The RenderContext represents the parts of rendering that are specific to one request.
 */
export interface RenderContext {
	request: Request;
	origin: string;
	pathname: string;
	url: URL;
	scripts?: Set<SSRElement>;
	links?: Set<SSRElement>;
	styles?: Set<SSRElement>;
	componentMetadata?: SSRResult['componentMetadata'];
	route?: RouteData;
	status?: number;
	params: Params;
	props: Props;
}

export type CreateRenderContextArgs = Partial<RenderContext> & {
	origin?: string;
	request: RenderContext['request'];
	mod: ComponentInstance;
	env: Environment;
};

export async function createRenderContext(
	options: CreateRenderContextArgs
): Promise<RenderContext> {
	const request = options.request;
	const url = new URL(request.url);
	const origin = options.origin ?? url.origin;
	const pathname = options.pathname ?? url.pathname;
	const [params, props] = await getParamsAndPropsOrThrow({
		mod: options.mod as any,
		route: options.route,
		routeCache: options.env.routeCache,
		pathname: pathname,
		logging: options.env.logging,
		ssr: options.env.ssr,
	});
	return {
		...options,
		origin,
		pathname,
		url,
		params,
		props,
	};
}
