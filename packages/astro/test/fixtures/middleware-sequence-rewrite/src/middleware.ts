import type { MiddlewareHandler } from 'astro';
import { sequence } from 'astro:middleware';

export const mid1: MiddlewareHandler = async ({ cookies, url, rewrite, request }, next) => {
	cookies.set('cookie1', 'Cookie from middleware 1');
	if (url.pathname === '/') {
		console.log('Rewriting');
		return rewrite('/another');
	}
	return next();
};

export const mid2: MiddlewareHandler = async ({ cookies, url }, next) => {
	cookies.set('cookie2', 'Cookie from middleware 2');
	const res = next();
	return res;
};

export const onRequest: MiddlewareHandler = sequence(mid1, mid2);
