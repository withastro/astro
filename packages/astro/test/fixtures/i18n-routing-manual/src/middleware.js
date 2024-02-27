import { defineMiddleware } from 'astro:middleware';
import { redirectToDefaultLocale, requestHasLocale } from 'astro:i18n';

const allowList = new Set(['/help', '/help/']);

export const onRequest = defineMiddleware(async (context, next) => {
	if (allowList.has(context.url.pathname)) {
		return await next();
	}
	if (requestHasLocale(context)) {
		return await next();
	}

	if (context.url.pathname === '/') {
		return redirectToDefaultLocale(context);
	}
	return new Response(null, {
		status: 404,
	});
});
