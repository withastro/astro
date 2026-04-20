import type { BaseApp } from '../app/base.js';
import { FetchState } from '../app/fetch-state.js';
import { appSymbol } from '../constants.js';
import { AstroHandler } from '../routing/handler.js';

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

function getApp(request: Request): BaseApp<any> {
	const app = Reflect.get(request, appSymbol) as BaseApp<any> | undefined;
	if (!app) {
		throw new Error(
			'astro() Hono middleware called without an attached app. Ensure it runs inside Astro\'s request pipeline.',
		);
	}
	return app;
}

function getFetchState(context: HonoContextLike, app: BaseApp<any>): FetchState {
	const state = context.get?.(FETCH_STATE_KEY) as FetchState | undefined;
	if (state) {
		return state;
	}

	const nextState = new FetchState(app.pipeline, context.req.raw);
	context.set?.(FETCH_STATE_KEY, nextState);
	return nextState;
}

export function astro(): HonoMiddlewareHandler {
	let app: BaseApp<any> | null = null;
	let handler: AstroHandler | null = null;

	return async (context, _next) => {
		const currentApp = getApp(context.req.raw);
		if (app !== currentApp || !handler) {
			app = currentApp;
			handler = new AstroHandler(currentApp);
		}

		return handler.handle(getFetchState(context, currentApp));
	};
}
