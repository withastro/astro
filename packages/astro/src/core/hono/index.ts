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

export { FetchState };
export type { AstroFetchState } from '../fetch/index.js';

const FETCH_STATE_KEY = 'fetchState';

type HonoContextLike = {
	req: {
		raw: Request;
	};
	res: Response;
	get?: (key: string) => unknown;
	set?: (key: string, value: unknown) => void;
};

type HonoMiddlewareHandler = (
	context: HonoContextLike,
	next: () => Promise<void>,
) => Promise<Response | void>;

function getFetchState(context: HonoContextLike): FetchState {
	const state = context.get?.(FETCH_STATE_KEY) as FetchState | undefined;
	if (state) {
		return state;
	}

	const nextState = new FetchState(context.req.raw);
	context.set?.(FETCH_STATE_KEY, nextState);
	return nextState;
}

export function astro(): HonoMiddlewareHandler {
	return async (context, _next) => {
		return fetchAstro(getFetchState(context));
	};
}

export function trailingSlash(): HonoMiddlewareHandler {
	return async (context, honoNext) => {
		const redirect = fetchTrailingSlash(getFetchState(context));
		if (redirect) return redirect;
		await honoNext();
	};
}

export function middleware(): HonoMiddlewareHandler {
	return async (context, honoNext) => {
		return fetchMiddleware(getFetchState(context), async () => {
			await honoNext();
			return context.res;
		});
	};
}

export function redirects(): HonoMiddlewareHandler {
	return async (context, honoNext) => {
		const response = fetchRedirects(getFetchState(context));
		if (response) return response;
		await honoNext();
	};
}

export function actions(): HonoMiddlewareHandler {
	return async (context, honoNext) => {
		const result = fetchActions(getFetchState(context));
		if (result) {
			const response = await result;
			if (response) return response;
		}
		await honoNext();
	};
}

export function pages(): HonoMiddlewareHandler {
	return async (context, _honoNext) => {
		return fetchPages(getFetchState(context));
	};
}

export function sessions(): HonoMiddlewareHandler {
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

export function cache(next: () => Promise<Response>): HonoMiddlewareHandler {
	return async (context, _honoNext) => {
		return fetchCache(getFetchState(context), next);
	};
}

export function i18n(): HonoMiddlewareHandler {
	return async (context, honoNext) => {
		await honoNext();
		context.res = await fetchI18n(getFetchState(context), context.res);
	};
}
