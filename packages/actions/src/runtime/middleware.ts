import { defineMiddleware } from 'astro:middleware';
import { ApiContextStorage, formContentTypes, getAction } from './utils.js';

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.getActionResult = (action) => undefined;

	const { request } = context;
	const contentType = request.headers.get('Content-Type');
	if (!formContentTypes.some((f) => contentType?.startsWith(f))) return next();

	const formData = await request.clone().formData();
	const actionPath = formData.get('_astroAction');
	if (typeof actionPath !== 'string') return next();

	const actionPathKeys = actionPath.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	let result: any;
	try {
		result = await ApiContextStorage.run(context, () => action(formData));
	} catch (e) {
		if (e instanceof Response) {
			return e;
		}
		throw e;
	}
	context.locals.getActionResult = (action) => {
		if (action.toString() === actionPath) return result;
	};
	return next();
});
