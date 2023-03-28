import type { RouteData, SSRElement, SSRResult } from '../../@types/astro';

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
}

export type CreateRenderContextArgs = Partial<RenderContext> & {
	origin?: string;
	request: RenderContext['request'];
};

export function createRenderContext(options: CreateRenderContextArgs): RenderContext {
	const request = options.request;
	const url = new URL(request.url);
	const origin = options.origin ?? url.origin;
	const pathname = options.pathname ?? url.pathname;
	return {
		...options,
		origin,
		pathname,
		url,
	};
}
