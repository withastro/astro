import type { SerializedStaticImage } from '../../assets/types.js';
import type { PrerenderResult } from '../../types/public/integrations.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
import { getEnvironment, setEnvironment } from '../environment/index.js';
import {
	collectPrerenderMetadata,
	type CollectPrerenderMetadataOptions,
} from '@astrojs/vite-plugin-astro/internal/core/render-scope/collect.js';
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
	/** @deprecated Metadata is always collected. */
	collectMetadata?: boolean;
	/** See {@link CollectPrerenderMetadataOptions.staticImages}. Default `true`. */
	staticImages?: boolean;
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

/**
 * Renders a single prerendered path through `app.render`, collecting the
 * per-render metadata (content entries rendered, image transforms resolved)
 * and returning it by value on the result.
 *
 * The response body is fully buffered *inside* the render scope so
 * lazily-driven rendering work records before the metadata snapshot; the
 * returned response is a reconstruction carrying the buffered body with
 * status/statusText/headers and body-nullness preserved.
 *
 * This function performs no scope installation; installing a render scope for
 * the rendering runtime is the caller's responsibility. When no scope is
 * installed, `metadata` is `undefined` ("not tracked").
 */
export async function renderForPrerender(
	app: PrerenderableApp,
	request: Request,
	options?: PrerenderRenderOptions,
): Promise<PrerenderResult> {
	if (app.manifest) {
		useBuildErrorStrategy(app.manifest);
	}
	const routeData = options?.routeData;
	const { value: response, metadata } = await collectPrerenderMetadata<
		Response,
		SerializedStaticImage
	>(
		async () => {
			const rendered = await app.render(request, { routeData });
			const bytes = rendered.body === null ? null : await rendered.arrayBuffer();
			const nullBody = bytes === null || NULL_BODY_STATUSES.includes(rendered.status);
			return new Response(nullBody ? null : bytes, {
				status: rendered.status,
				statusText: rendered.statusText,
				headers: rendered.headers,
			});
		},
		app.logger,
		{ staticImages: options?.staticImages },
	);
	return { response, metadata };
}
