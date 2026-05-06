import { defineMiddleware } from 'astro:middleware';
import { auth } from '../auth';

const originalRequestCookieName = 'original-request';

function normalizePathname(pathname: string): string {
	if (pathname === '/') {
		return pathname;
	}
	return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isPublicPath(pathname: string): boolean {
	const publicPaths = ['/', '/login', '/api/login'];
	if (publicPaths.includes(pathname)) {
		return true;
	}
	// Allow serving image assets without authentication
	if (pathname.startsWith('/_image')) {
		return true;
	}
	return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = normalizePathname(context.originPathname);

	if (pathname === '/api/finish-login') {
		const isAuthed = await auth.api.getSession(context);
		if (!isAuthed) {
			return context.redirect('/login', 302);
		}
		const originalRequest = context.cookies.get(originalRequestCookieName)?.value;
		const redirectTo = originalRequest ? decodeURIComponent(originalRequest) : '/';
		context.cookies.delete(originalRequestCookieName, { path: '/' });
		return context.redirect(redirectTo, 302);
	}

	if (isPublicPath(pathname)) {
		return next();
	}

	const isAuthed = await auth.api.getSession(context);
	if (!isAuthed) {
		context.cookies.set(originalRequestCookieName, encodeURIComponent(pathname), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
		});
		return context.redirect('/login', 302);
	}

	return next();
});
