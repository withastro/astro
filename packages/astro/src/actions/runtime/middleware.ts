import { defineMiddleware } from '../../core/middleware/index.js';
import { ApiContextStorage } from './store.js';
import { formContentTypes, getAction } from './utils.js';
import { ActionError } from './virtual/shared.js';
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
	if (!formContentTypes.some((f) => contentType?.startsWith(f))) return next();

	const formData = await request.clone().formData();
	const actionPath = formData.get('_astroAction');
	if (typeof actionPath !== 'string') return next();

	const actionPathKeys = actionPath.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	let result: any;
	let actionError: ActionError | undefined;
	try {
		result = await ApiContextStorage.run(context, () => action(formData));
	} catch (e) {
		if (!(e instanceof ActionError)) {
			throw e;
		}
		actionError = e;
	}
	locals._actionsInternal = {
		getActionResult: (actionFn) => {
			if (actionFn.toString() !== actionPath) return Promise.resolve(undefined);
			if (Symbol.for('astro:action:safe') in actionFn) {
				if (actionError) {
					return { data: undefined, error: actionError };
				}
				return { data: result, error: undefined };
			}
			if (actionError) throw actionError;
			return result;
		},
	};
	return next();
});
