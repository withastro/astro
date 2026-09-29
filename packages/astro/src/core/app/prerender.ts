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
}

/** Statuses the `Response` constructor rejects a body for. */
const NULL_BODY_STATUSES = [101, 204, 205, 304];

/** Renders a prerendered path with its metadata, which is `undefined` if no render scope is installed. */
export async function renderForPrerender(
	app: PrerenderableApp,
	request: Request,
	options?: PrerenderRenderOptions,
): Promise<PrerenderResult> {
	const routeData = options?.routeData;
	const { value: response, metadata } = await collectPrerenderMetadata(async () => {
		// Buffer inside the scope so lazily streamed rendering records before the snapshot.
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
