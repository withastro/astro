import { ActionHandler } from '../../actions/handler.js';
import { FetchState as BaseFetchState } from './fetch-state.js';
import { CacheHandler } from '../cache/handler.js';
import { appSymbol } from '../constants.js';
import { I18n } from '../i18n/handler.js';
import { AstroMiddleware } from '../middleware/astro-middleware.js';
import { PagesHandler } from '../pages/handler.js';
import { renderRedirect } from '../redirects/render.js';
import { AstroHandler } from '../routing/handler.js';
import { provideSession } from '../session/handler.js';
import { TrailingSlashHandler } from '../routing/trailing-slash-handler.js';
function getApp(request) {
	const app = Reflect.get(request, appSymbol);
	if (!app) {
		throw new Error(
			"FetchState(request) called on a request without an attached app. Ensure it runs inside Astro's request pipeline.",
		);
	}
	return app;
}
class FetchState extends BaseFetchState {
	constructor(request) {
		super(getApp(request).pipeline, request);
	}
}
const astroHandlers = /* @__PURE__ */ new WeakMap();
function astro(state) {
	const app = getApp(state.request);
	let handler = astroHandlers.get(app);
	if (!handler) {
		handler = new AstroHandler(app);
		astroHandlers.set(app, handler);
	}
	return handler.handle(state);
}
const trailingSlashHandlers = /* @__PURE__ */ new WeakMap();
function trailingSlash(state) {
	const app = getApp(state.request);
	let handler = trailingSlashHandlers.get(app);
	if (!handler) {
		handler = new TrailingSlashHandler(app);
		trailingSlashHandlers.set(app, handler);
	}
	return handler.handle(state);
}
const middlewareInstances = /* @__PURE__ */ new WeakMap();
function middleware(state, next) {
	const app = getApp(state.request);
	let mw = middlewareInstances.get(app);
	if (!mw) {
		mw = new AstroMiddleware(app.pipeline);
		middlewareInstances.set(app, mw);
	}
	return mw.handle(state, (s, _ctx) => next(s));
}
const pagesHandlers = /* @__PURE__ */ new WeakMap();
function pages(state) {
	const app = getApp(state.request);
	let handler = pagesHandlers.get(app);
	if (!handler) {
		handler = new PagesHandler(app.pipeline);
		pagesHandlers.set(app, handler);
	}
	return handler.handle(state, state.getAPIContext());
}
function sessions(state) {
	return provideSession(state);
}
function redirects(state) {
	if (state.routeData?.type === 'redirect') {
		return renderRedirect(state);
	}
	return void 0;
}
const actionHandlers = /* @__PURE__ */ new WeakMap();
function actions(state) {
	const app = getApp(state.request);
	let handler = actionHandlers.get(app);
	if (!handler) {
		handler = new ActionHandler();
		actionHandlers.set(app, handler);
	}
	return handler.handle(state.getAPIContext(), state);
}
const i18nHandlers = /* @__PURE__ */ new WeakMap();
function getI18n(app) {
	let handler = i18nHandlers.get(app);
	if (handler === void 0) {
		const config = app.manifest.i18n;
		handler =
			config && config.strategy !== 'manual'
				? new I18n(config, app.manifest.base, app.manifest.trailingSlash, app.manifest.buildFormat)
				: null;
		i18nHandlers.set(app, handler);
	}
	return handler;
}
function i18n(state, response) {
	const handler = getI18n(getApp(state.request));
	if (!handler) return Promise.resolve(response);
	return handler.finalize(state, response);
}
const cacheHandlers = /* @__PURE__ */ new WeakMap();
function cache(state, next) {
	const app = getApp(state.request);
	let handler = cacheHandlers.get(app);
	if (!handler) {
		handler = new CacheHandler(app);
		cacheHandlers.set(app, handler);
	}
	return handler.handle(state, next);
}
export {
	FetchState,
	actions,
	astro,
	cache,
	i18n,
	middleware,
	pages,
	redirects,
	sessions,
	trailingSlash,
};
