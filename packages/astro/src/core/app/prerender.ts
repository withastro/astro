import type { PrerenderResult } from '../../types/public/integrations.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
import { getEnvironment, setEnvironment } from '../environment/index.js';
import { collectPrerenderMetadata } from '../render-scope/collect.js';
import type { SSRManifest } from './types.js';

export interface PrerenderableApp {
	logger: AstroLogger;
	/**
	 * The app's manifest. When present, render errors use build semantics (they
	 * throw instead of rendering a 500 page) for this manifest.
	 */
	manifest?: SSRManifest;
	render(request: Request, opts: { routeData?: RouteData }): Promise<Response>;
}

export interface PrerenderRenderOptions {
	routeData?: RouteData;
}

/**
 * Makes render errors fail the prerender instead of rendering a 500 page.
 *
 * Adapter runtimes that prerender with a production app (e.g. the Cloudflare
 * prerender worker) default to the production error strategy, which turns a
 * render error into a 500 page. Requests handled by the app itself can be
 * intercepted through `app.renderError`, but requests handled by a user-provided
 * `src/fetch.ts` (`astro(new FetchState(request))`) resolve the error strategy
 * from the manifest's environment, so it must be switched there too. Otherwise
 * the error is swallowed and an empty page is written to disk.
 *
 * Only the production (`default`) strategy is replaced; dev and build
 * environments already have the right behavior.
 */
function useBuildErrorStrategy(manifest: SSRManifest): void {
	const env = getEnvironment(manifest);
	if (env.errorStrategy === 'default') {
		setEnvironment(manifest, { ...env, errorStrategy: 'build' });
	}
}

/** Statuses the `Response` constructor rejects a body for. */
const NULL_BODY_STATUSES = [101, 204, 205, 304];

/** Renders a prerendered path with its metadata, which is `undefined` if no render scope is installed. */
export async function renderForPrerender(
	app: PrerenderableApp,
	request: Request,
	options?: PrerenderRenderOptions,
): Promise<PrerenderResult> {
	if (app.manifest) {
		useBuildErrorStrategy(app.manifest);
	}
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
