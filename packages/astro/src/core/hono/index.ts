import {
	FetchState,
	actions as fetchActions,
	astro as fetchAstro,
	i18n as fetchI18n,
	middleware as fetchMiddleware,
	pages as fetchPages,
	trailingSlash as fetchTrailingSlash,
} from '../fetch/index.js';

export { FetchState };

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

export function middleware(
	next: (state: FetchState) => Promise<Response>,
): HonoMiddlewareHandler {
	return async (context, _honoNext) => {
		return fetchMiddleware(getFetchState(context), next);
	};
}

export function actions(): HonoMiddlewareHandler {
	return async (context, honoNext) => {
		const response = await fetchActions(getFetchState(context));
		if (response) return response;
		await honoNext();
	};
}

export function pages(): HonoMiddlewareHandler {
	return async (context, _honoNext) => {
		return fetchPages(getFetchState(context));
	};
}

export function i18n(): HonoMiddlewareHandler {
	return async (context, honoNext) => {
		await honoNext();
		context.res = await fetchI18n(getFetchState(context), context.res);
	};
}
