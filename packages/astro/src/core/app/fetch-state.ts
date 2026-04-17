import { prependForwardSlash } from '@astrojs/internal-helpers/path';
import type { RouteData } from '../../types/public/internal.js';
import { DEFAULT_404_COMPONENT } from '../constants.js';
import { routeHasHtmlExtension } from '../routing/helpers.js';
import type { BaseApp, ResolvedRenderOptions } from './base.js';
import { getRenderOptions } from './render-options.js';

/**
 * Holds per-request state as it flows through the handler pipeline.
 *
 * `FetchState` centralizes things that used to be ad-hoc locals in
 * `AstroHandler.handle()`: the matched route, the resolved pathname, the
 * resolved render options, etc. Handler steps can read and mutate it as
 * the request progresses.
 *
 * A `FetchState` can be mutated mid-request (for rewrites) and re-run
 * through `AstroHandler.render(state)` to produce a new response without
 * losing cross-route state like `locals`, `addCookieHeader`, etc.
 */
export class FetchState {
	#app: BaseApp<any>;
	/**
	 * The request to render. Mutated during rewrites so subsequent renders
	 * see the rewritten URL.
	 */
	request: Request;
	routeData: RouteData | undefined;
	/**
	 * The pathname to use for routing and rendering. Starts out as the raw,
	 * base-stripped, decoded pathname from the request. After
	 * `validateRouteData()` runs it may be further normalized (in dev, when
	 * the matched route has no `.html` extension, `.html` / `/index.html`
	 * suffixes are stripped).
	 */
	pathname: string;
	/** Resolved render options (addCookieHeader, clientAddress, locals, etc.). */
	readonly renderOptions: ResolvedRenderOptions;
	/** When the request started, used to log duration. */
	readonly timeStart: number;

	constructor(app: BaseApp<any>, request: Request) {
		this.#app = app;
		this.request = request;
		const options = getRenderOptions(request);
		this.routeData = options?.routeData;
		this.renderOptions = {
			addCookieHeader: options?.addCookieHeader ?? false,
			clientAddress: options?.clientAddress,
			locals: options?.locals,
			prerenderedErrorPageFetch: options?.prerenderedErrorPageFetch ?? fetch,
			routeData: options?.routeData,
		};
		this.pathname = this.#computePathname();
		this.timeStart = performance.now();
	}

	/**
	 * Strips the app's base from the request URL, prepends a forward slash,
	 * and decodes the pathname. Falls back to the raw (not decoded) pathname
	 * if `decodeURI` throws, logging the error via the adapter logger.
	 */
	#computePathname(): string {
		const url = new URL(this.request.url);
		const pathname = prependForwardSlash(this.#app.removeBase(url.pathname));
		try {
			return decodeURI(pathname);
		} catch (e: any) {
			this.#app.getAdapterLogger().error(e.toString());
			return pathname;
		}
	}

	/**
	 * Recomputes `this.pathname` from `this.request` and re-normalizes it
	 * against `this.routeData`. Used after a rewrite mutates `request` /
	 * `routeData` so the next render sees the right pathname.
	 */
	refreshPathname(): void {
		this.pathname = this.#computePathname();
		if (this.routeData && this.#app.isDev() && !routeHasHtmlExtension(this.routeData)) {
			this.pathname = this.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}
	}

	/**
	 * Resolves the route to use for this request and stores it on
	 * `this.routeData`. If the adapter provided a `routeData` via render
	 * options it's used as-is. Otherwise we try the app's route matcher
	 * (dev or prod) and fall back to a `404.astro` route so middleware can
	 * still run.
	 *
	 * Once routeData is known, finalize `this.pathname`: in dev, if the
	 * matched route has no `.html` extension, strip `.html` / `/index.html`
	 * suffixes so the render context sees the canonical pathname.
	 *
	 * Returns `true` when `this.routeData` is populated, or `false` when
	 * no route could be found (the caller should render a 404 error page).
	 */
	async validateRouteData(): Promise<boolean> {
		const app = this.#app;
		const request = this.request;

		if (!this.routeData) {
			if (app.isDev()) {
				const result = await app.devMatch(this.pathname);
				if (result) {
					this.routeData = result.routeData;
				}
			} else {
				this.routeData = app.match(request);
			}

			app.logger.debug('router', 'Astro matched the following route for ' + request.url);
			app.logger.debug('router', 'RouteData:\n' + this.routeData);
		}
		// At this point we haven't found a route that matches the request, so we create
		// a "fake" 404 route, so we can call the RenderContext.render
		// and hit the middleware, which might be able to return a correct Response.
		if (!this.routeData) {
			this.routeData = app.manifestData.routes.find(
				(route) => route.component === '404.astro' || route.component === DEFAULT_404_COMPONENT,
			);
		}
		if (!this.routeData) {
			app.logger.debug('router', "Astro hasn't found routes that match " + request.url);
			app.logger.debug('router', "Here's the available routes:\n", app.manifestData);
			return false;
		}
		// In dev, the route may have matched a normalized pathname (after .html stripping).
		// Skip normalization if the route already has an .html extension in its definition.
		if (app.isDev() && !routeHasHtmlExtension(this.routeData)) {
			this.pathname = this.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
		}
		return true;
	}
}
