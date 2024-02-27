import { defineMiddleware, sequence } from 'astro:middleware';
import { middleware } from 'astro:i18n';

const customLogic = defineMiddleware(async (context, next) => {
	const response = await next();

	return response;
});

export const onRequest = sequence(customLogic, middleware());
