import type { APIContext, MiddlewareNext } from '../../@types/astro.js';
import { defineMiddleware } from '../../core/middleware/index.js';
import { ApiContextStorage } from './store.js';
import { formContentTypes, getAction, hasContentType } from './utils.js';
import { callSafely } from './virtual/shared.js';

export type Locals = {
	_actionsInternal: {
		getActionResult: APIContext['getActionResult'];
	};
};

export const onRequest = defineMiddleware(async (context, next) => {
	const locals = context.locals as Locals;
	const { request, url } = context;
	const contentType = request.headers.get('Content-Type');

	// Avoid double-handling with middleware when calling actions directly.
	if (url.pathname.startsWith('/_actions')) return nextWithLocalsStub(next, locals);

	if (!contentType || !hasContentType(contentType, formContentTypes))
		return nextWithLocalsStub(next, locals);

	const formData = await request.clone().formData();
	const actionPath = formData.get('_astroAction');
	if (typeof actionPath !== 'string') return nextWithLocalsStub(next, locals);

	const actionPathKeys = actionPath.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	const result = await ApiContextStorage.run(context, () => callSafely(() => action(formData)));

	const actionsInternal: Locals['_actionsInternal'] = {
		getActionResult: (actionFn) => {
			if (actionFn.toString() !== actionPath) return Promise.resolve(undefined);
			// The `action` uses type `unknown` since we can't infer the user's action type.
			// Cast to `any` to satisfy `getActionResult()` type.
			return result as any;
		},
	};
	Object.defineProperty(locals, '_actionsInternal', { writable: false, value: actionsInternal });
	return next();
});

function nextWithLocalsStub(next: MiddlewareNext, locals: Locals) {
	Object.defineProperty(locals, '_actionsInternal', {
		writable: false,
		value: {
			getActionResult: () => undefined,
		},
	});
	return next();
}
