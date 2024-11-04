import { defineMiddleware } from '../../virtual-modules/middleware.js';
import { getMiddlewareContext } from './virtual/server.js';

export const onRequest = defineMiddleware(async (context, next) => {
	if ((context as any)._isPrerendered) return next();
	const { action, setActionResult, serializeActionResult } = getMiddlewareContext(context);

	if (action) {
		const actionResult = await action.handler();
		setActionResult(action.name, serializeActionResult(actionResult));
	}
	return next();
});
