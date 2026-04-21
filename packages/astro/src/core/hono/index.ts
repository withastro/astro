import { FetchState, astro as fetchAstro } from '../fetch/index.js';

const FETCH_STATE_KEY = 'fetchState';

type HonoContextLike = {
	req: {
		raw: Request;
	};
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
