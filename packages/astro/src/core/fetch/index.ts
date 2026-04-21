import type { BaseApp } from '../app/base.js';
import { FetchState as BaseFetchState } from '../app/fetch-state.js';
import { appSymbol } from '../constants.js';
import { AstroHandler } from '../routing/handler.js';

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

const handlers = new WeakMap<BaseApp<any>, AstroHandler>();

export function astro(state: FetchState): Promise<Response> {
	const app = getApp(state.request);
	let handler = handlers.get(app);
	if (!handler) {
		handler = new AstroHandler(app);
		handlers.set(app, handler);
	}
	return handler.handle(state);
}
