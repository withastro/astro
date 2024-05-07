import { defineMiddleware } from '../../core/middleware/index.js';
import { ApiContextStorage } from './store.js';
import { formContentTypes, getAction, hasContentType } from './utils.js';
import { callSafely } from './virtual/shared.js';
import type { APIContext } from '../../@types/astro.js';

export type Locals = {
	_actionsInternal: {
		getActionResult: APIContext['getActionResult'];
	};
};

export const onRequest = defineMiddleware(async (context, next) => {
	const locals = context.locals as Locals;
	const { request } = context;
	const contentType = request.headers.get('Content-Type');
	locals._actionsInternal = {
		getActionResult: () => undefined,
	};

	if (!contentType || !hasContentType(contentType, formContentTypes)) return next();

	const formData = await request.clone().formData();
	const actionPath = formData.get('_astroAction');
	if (typeof actionPath !== 'string') return next();

	const actionPathKeys = actionPath.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	const result = await ApiContextStorage.run(context, () => callSafely(() => action(formData)));

	locals._actionsInternal = {
		getActionResult: (actionFn) => {
			if (actionFn.toString() !== actionPath) return Promise.resolve(undefined);
			// The `action` uses type `unknown` since we can't infer the user's action type.
			// Cast to `any` to satisfy `getActionResult()` type.
			return result as any;
		},
	};
	return next();
});
