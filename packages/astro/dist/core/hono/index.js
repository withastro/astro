import {
	FetchState,
	actions as fetchActions,
	astro as fetchAstro,
	cache as fetchCache,
	i18n as fetchI18n,
	middleware as fetchMiddleware,
	pages as fetchPages,
	redirects as fetchRedirects,
	sessions as fetchSessions,
	trailingSlash as fetchTrailingSlash,
} from '../fetch/index.js';
const FETCH_STATE_KEY = 'fetchState';
function getFetchState(context) {
	const state = context.get?.(FETCH_STATE_KEY);
	if (state) {
		return state;
	}
	const nextState = new FetchState(context.req.raw);
	context.set?.(FETCH_STATE_KEY, nextState);
	return nextState;
}
function astro() {
	return async (context, _next) => {
		return fetchAstro(getFetchState(context));
	};
}
function trailingSlash() {
	return async (context, honoNext) => {
		const redirect = fetchTrailingSlash(getFetchState(context));
		if (redirect) return redirect;
		await honoNext();
	};
}
function middleware() {
	return async (context, honoNext) => {
		return fetchMiddleware(getFetchState(context), async () => {
			await honoNext();
			return context.res;
		});
	};
}
function redirects() {
	return async (context, honoNext) => {
		const response = fetchRedirects(getFetchState(context));
		if (response) return response;
		await honoNext();
	};
}
function actions() {
	return async (context, honoNext) => {
		const result = fetchActions(getFetchState(context));
		if (result) {
			const response = await result;
			if (response) return response;
		}
		await honoNext();
	};
}
function pages() {
	return async (context, _honoNext) => {
		return fetchPages(getFetchState(context));
	};
}
function sessions() {
	return async (context, honoNext) => {
		const state = getFetchState(context);
		await fetchSessions(state);
		try {
			await honoNext();
		} finally {
			await state.finalizeAll();
		}
	};
}
function cache(next) {
	return async (context, _honoNext) => {
		return fetchCache(getFetchState(context), next);
	};
}
function i18n() {
	return async (context, honoNext) => {
		await honoNext();
		context.res = await fetchI18n(getFetchState(context), context.res);
	};
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
