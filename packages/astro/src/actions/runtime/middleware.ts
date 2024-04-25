import { defineMiddleware } from '../../core/middleware/index.js';
import { ApiContextStorage } from './store.js';
import { formContentTypes, getAction } from './utils.js';
import { ActionError } from './virtual.js';

type Locals = {
	getActionResult: <T extends (...args: any) => any>(
		action: T
	) => Promise<Awaited<ReturnType<T>> | undefined>;
};

export const onRequest = defineMiddleware(async (context, next) => {
	const locals = context.locals as Locals;
	locals.getActionResult = () => Promise.resolve(undefined);

	const { request } = context;
	const contentType = request.headers.get('Content-Type');
	if (!formContentTypes.some((f) => contentType?.startsWith(f))) return next();

	const formData = await request.clone().formData();
	const actionPath = formData.get('_astroAction');
	if (typeof actionPath !== 'string') return next();

	const actionPathKeys = actionPath.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	let result: any;
	// TODO: throw unhandled actionError.
	// Maybe use post middleware to throw if `getActionResult()` is not called.
	let actionError: ActionError | undefined;
	try {
		result = await ApiContextStorage.run(context, () => action(formData));
	} catch (e) {
		if (!(e instanceof ActionError) || e.status === 'INTERNAL_SERVER_ERROR') {
			throw e;
		}
		actionError = e;
	}
	locals.getActionResult = (actionFn) => {
		if (actionFn.toString() !== actionPath) return Promise.resolve(undefined);
		if (actionError) return Promise.reject(actionError);
		return Promise.resolve(result);
	};
	return next();
});
