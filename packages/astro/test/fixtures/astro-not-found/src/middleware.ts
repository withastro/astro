import { notFound } from 'astro:navigation';
import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (ctx, next) => {
	if (ctx.url.pathname === '/middleware-not-found') {
		notFound('Middleware item not found', 'Middleware Title');
	}
	return next();
};
