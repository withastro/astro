import type { PrerenderResult } from '../../types/public/integrations.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
import { collectPrerenderMetadata } from '../render-scope/collect.js';

export interface PrerenderableApp {
	logger: AstroLogger;
	render(request: Request, opts: { routeData?: RouteData }): Promise<Response>;
}

export interface PrerenderRenderOptions {
	routeData?: RouteData;
	/** Collect per-render incremental metadata and return it on the result. Default false. */
	collectMetadata?: boolean;
}

/** Statuses the `Response` constructor rejects a body for. */
const NULL_BODY_STATUSES = [101, 204, 205, 304];

/**
 * Renders a single prerendered path through `app.render`, optionally collecting
 * the per-render incremental metadata (content entries rendered, image
 * transforms resolved) and returning it by value on the result.
 *
 * When not collecting, this short-circuits to a bare `app.render` — the
 * response is the app's own, unbuffered. When collecting, the response body is
 * fully buffered *inside* the render scope so lazily-driven rendering work
 * records before the metadata snapshot; the returned response is a
 * reconstruction carrying the buffered body with status/statusText/headers and
 * body-nullness preserved.
 *
 * This function performs no scope installation; installing a render scope for
 * the rendering runtime is the caller's responsibility. When collection is
 * requested but no scope is installed, `metadata` is `undefined`
 * ("not tracked").
 */
export async function renderForPrerender(
	app: PrerenderableApp,
	request: Request,
	options?: PrerenderRenderOptions,
): Promise<PrerenderResult> {
	const routeData = options?.routeData;
	if (!options?.collectMetadata) {
		return { response: await app.render(request, { routeData }) };
	}
	const { value: response, metadata } = await collectPrerenderMetadata(async () => {
		const rendered = await app.render(request, { routeData });
		const bytes = rendered.body === null ? null : await rendered.arrayBuffer();
		const nullBody = bytes === null || NULL_BODY_STATUSES.includes(rendered.status);
		return new Response(nullBody ? null : bytes, {
			status: rendered.status,
			statusText: rendered.statusText,
			headers: rendered.headers,
		});
	}, app.logger);
	return { response, metadata };
}
