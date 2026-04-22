import { ActionHandler } from '../../actions/handler.js';
import type { BaseApp } from '../app/base.js';
import { FetchState as BaseFetchState } from '../app/fetch-state.js';
import { CacheHandler } from '../cache/handler.js';
import { appSymbol } from '../constants.js';
import { I18n } from '../i18n/handler.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { renderRedirect } from '../redirects/render.js';
import { AstroHandler } from '../routing/handler.js';
import { provideSession } from '../session/handler.js';
import { TrailingSlashHandler } from '../routing/trailing-slash-handler.js';

function getApp(request: Request): BaseApp<any> {
	const app = Reflect.get(request, appSymbol) as BaseApp<any> | undefined;
	if (!app) {
		throw new Error(
			'FetchState(request) called on a request without an attached app. ' +
				'Ensure it runs inside Astro\'s request pipeline.',
		);
	}
	return app;
}

export class FetchState extends BaseFetchState {
	constructor(request: Request) {
		super(getApp(request).pipeline, request);
	}
}

const astroHandlers = new WeakMap<BaseApp<any>, AstroHandler>();

export function astro(state: FetchState): Promise<Response> {
	const app = getApp(state.request);
	let handler = astroHandlers.get(app);
	if (!handler) {
		handler = new AstroHandler(app);
		astroHandlers.set(app, handler);
	}
	return handler.handle(state);
}

const trailingSlashHandlers = new WeakMap<BaseApp<any>, TrailingSlashHandler>();

/**
 * Checks if the request pathname needs trailing-slash normalization and
 * returns a redirect `Response` if so. Returns `undefined` when no
 * redirect is needed and the caller should continue processing.
 */
export function trailingSlash(state: FetchState): Response | undefined {
	const app = getApp(state.request);
	let handler = trailingSlashHandlers.get(app);
	if (!handler) {
		handler = new TrailingSlashHandler(app);
		trailingSlashHandlers.set(app, handler);
	}
	return handler.handle(state.request);
}

const middlewareInstances = new WeakMap<BaseApp<any>, AstroMiddleware>();

/**
 * Runs Astro's middleware chain for the given state, calling `next` at
 * the bottom of the chain to produce the response. Lazily creates
 * the render context if needed.
 */
export function middleware(
	state: FetchState,
	next: (state: FetchState) => Promise<Response>,
): Promise<Response> {
	state.ensureRenderContext();
	const app = getApp(state.request);
	let mw = middlewareInstances.get(app);
	if (!mw) {
		mw = new AstroMiddleware(app.pipeline);
		middlewareInstances.set(app, mw);
	}
	return mw.handle(state, (s, _ctx, _payload) => next(s));
}

const pagesHandlers = new WeakMap<BaseApp<any>, PagesHandler>();

/**
 * Dispatches the request to the matched route (endpoint, page, redirect,
 * or fallback). Lazily creates the render context if needed.
 */
export function pages(state: FetchState): Promise<Response> {
	state.ensureRenderContext();
	const app = getApp(state.request);
	let handler = pagesHandlers.get(app);
	if (!handler) {
		handler = new PagesHandler(app.pipeline);
		pagesHandlers.set(app, handler);
	}
	return handler.handle(state, state.getAPIContext(), undefined);
}

/**
 * Registers the session provider on the state. The session is created
 * lazily when user code accesses `ctx.session`, and persisted when
 * `state.finalizeAll()` is called. No-op if sessions are not configured.
 *
 * Call this early (before middleware runs). Call `state.finalizeAll()`
 * in a `finally` block after the response is produced to persist
 * any session mutations.
 */
export function sessions(state: FetchState): Promise<void> | void {
	return provideSession(state);
}

/**
 * Checks if the matched route is a redirect and returns the redirect
 * `Response` if so. Returns `undefined` when the route is not a
 * redirect and the caller should continue processing.
 * `state.routeData` must be set before calling this.
 */
export function redirects(state: FetchState): Promise<Response> | undefined {
	if (state.routeData?.type === 'redirect') {
		return renderRedirect(state);
	}
	return undefined;
}

const actionHandlers = new WeakMap<BaseApp<any>, ActionHandler>();

/**
 * Handles Astro Action requests (RPC + form). Returns a `Response` for
 * RPC actions, or `undefined` for form actions / non-action requests
 * (the caller should continue to page rendering). Lazily creates
 * the render context if needed.
 */
export function actions(state: FetchState): Promise<Response | undefined> | undefined {
	state.ensureRenderContext();
	const app = getApp(state.request);
	let handler = actionHandlers.get(app);
	if (!handler) {
		handler = new ActionHandler();
		actionHandlers.set(app, handler);
	}
	return handler.handle(state.getAPIContext());
}

// `null` sentinel means "i18n not configured" — avoids re-checking manifest each request.
const i18nHandlers = new WeakMap<BaseApp<any>, I18n | null>();

function getI18n(app: BaseApp<any>): I18n | null {
	let handler = i18nHandlers.get(app);
	if (handler === undefined) {
		const config = app.manifest.i18n;
		handler =
			config && config.strategy !== 'manual'
				? new I18n(config, app.manifest.base, app.manifest.trailingSlash, app.manifest.buildFormat)
				: null;
		i18nHandlers.set(app, handler);
	}
	return handler;
}

/**
 * Post-processes a response against the app's i18n configuration.
 * Handles locale redirects, 404s for invalid locales, and fallback
 * routing. Returns the response unmodified if i18n is not configured.
 */
export function i18n(state: FetchState, response: Response): Promise<Response> {
	const handler = getI18n(getApp(state.request));
	if (!handler) return Promise.resolve(response);
	return handler.finalize(state, response);
}

const cacheHandlers = new WeakMap<BaseApp<any>, CacheHandler>();

/**
 * Wraps a render callback with cache provider logic. Handles runtime
 * caching (onRequest), CDN-based providers (headers only), and the
 * no-cache case transparently. Cache headers are applied and stripped
 * internally.
 */
export function cache(
	state: FetchState,
	next: () => Promise<Response>,
): Promise<Response> {
	const app = getApp(state.request);
	let handler = cacheHandlers.get(app);
	if (!handler) {
		handler = new CacheHandler(app);
		cacheHandlers.set(app, handler);
	}
	return handler.handle(state, next);
}
