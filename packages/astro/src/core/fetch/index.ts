import type { BaseApp } from '../app/base.js';
import { FetchState as BaseFetchState } from '../app/fetch-state.js';
import { appSymbol } from '../constants.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { AstroHandler } from '../routing/handler.js';
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
 * the bottom of the chain to produce the response. The state must have
 * `renderContext` and `componentInstance` set before calling this.
 */
export function middleware(
	state: FetchState,
	next: (state: FetchState) => Promise<Response>,
): Promise<Response> {
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
 * or fallback). The state must have `renderContext` and
 * `componentInstance` set before calling this.
 */
export function pages(state: FetchState): Promise<Response> {
	const app = getApp(state.request);
	let handler = pagesHandlers.get(app);
	if (!handler) {
		handler = new PagesHandler(app.pipeline);
		pagesHandlers.set(app, handler);
	}
	return handler.handle(state, state.getAPIContext(), undefined);
}
