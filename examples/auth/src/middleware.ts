import { defineMiddleware } from 'astro:middleware';
import { auth } from '../auth';

const originalRequestCookieName = 'original-request';
const publicPaths = ['/', '/login', '/api/login'];

function normalizePathname(pathname: string): string {
	if (pathname === '/') {
		return pathname;
	}
	return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isPublicPath(pathname: string): boolean {
	return publicPaths.includes(pathname) || pathname.startsWith('/_image');
}

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = normalizePathname(context.originPathname);

	if (isPublicPath(pathname)) {
		return next();
	}

	const isAuthed = await auth.api.getSession(context);

	if (pathname === '/api/finish-login' && isAuthed) {
		const originalRequest = context.cookies.get(originalRequestCookieName)?.value;
		const redirectTo = originalRequest ? decodeURIComponent(originalRequest) : '/';
		context.cookies.delete(originalRequestCookieName, { path: '/' });
		return context.redirect(redirectTo, 302);
	}

	if (!isAuthed) {
		// Capture original page that was requested, to be able to bring the user back after logging in.
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
