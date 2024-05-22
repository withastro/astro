import { yellow } from 'kleur/colors';
import type { APIContext, MiddlewareNext } from '../../@types/astro.js';
import { defineMiddleware } from '../../core/middleware/index.js';
import { ApiContextStorage } from './store.js';
import { formContentTypes, getAction, hasContentType } from './utils.js';
import { callSafely } from './virtual/shared.js';

export type Locals = {
	_actionsInternal: {
		getActionResult: APIContext['getActionResult'];
		actionResult?: ReturnType<APIContext['getActionResult']>;
	};
};

export const onRequest = defineMiddleware(async (context, next) => {
	const locals = context.locals as Locals;
	if (context.request.method === 'GET') {
		return nextWithLocalsStub(next, locals);
	}

	// Heuristic: If body is null, Astro might've reset this for prerendering.
	// Stub with warning when `getActionResult()` is used.
	if (context.request.method === 'POST' && context.request.body === null) {
		return nextWithStaticStub(next, locals);
	}

	// Actions middleware may have run already after a path rewrite.
	// See https://github.com/withastro/roadmap/blob/feat/reroute/proposals/0047-rerouting.md#ctxrewrite
	// `_actionsInternal` is the same for every page,
	// so short circuit if already defined.
	if (locals._actionsInternal) return next();

	const { request, url } = context;
	const contentType = request.headers.get('Content-Type');

	// Avoid double-handling with middleware when calling actions directly.
	if (url.pathname.startsWith('/_actions')) return nextWithLocalsStub(next, locals);

	if (!contentType || !hasContentType(contentType, formContentTypes)) {
		return nextWithLocalsStub(next, locals);
	}

	const formData = await request.clone().formData();
	const actionPath = formData.get('_astroAction');
	if (typeof actionPath !== 'string') return nextWithLocalsStub(next, locals);

	const actionPathKeys = actionPath.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	if (!action) return nextWithLocalsStub(next, locals);

	const result = await ApiContextStorage.run(context, () => callSafely(() => action(formData)));

	const actionsInternal: Locals['_actionsInternal'] = {
		getActionResult: (actionFn) => {
			if (actionFn.toString() !== actionPath) return Promise.resolve(undefined);
			// The `action` uses type `unknown` since we can't infer the user's action type.
			// Cast to `any` to satisfy `getActionResult()` type.
			return result as any;
		},
		actionResult: result,
	};
	Object.defineProperty(locals, '_actionsInternal', { writable: false, value: actionsInternal });
	const response = await next();
	if (result.error) {
		return new Response(response.body, {
			status: result.error.status,
			statusText: result.error.name,
			headers: response.headers,
		});
	}
	return response;
});

function nextWithStaticStub(next: MiddlewareNext, locals: Locals) {
	Object.defineProperty(locals, '_actionsInternal', {
		writable: false,
		value: {
			getActionResult: () => {
				console.warn(
					yellow('[astro:actions]'),
					'`getActionResult()` should not be called on prerendered pages. Astro can only handle actions for pages rendered on-demand.'
				);
				return undefined;
			},
		},
	});
	return next();
}

function nextWithLocalsStub(next: MiddlewareNext, locals: Locals) {
	Object.defineProperty(locals, '_actionsInternal', {
		writable: false,
		value: {
			getActionResult: () => undefined,
		},
	});
	return next();
}
