import { defineMiddleware } from 'astro:middleware';
import { auth } from '../auth';

const originalRequestCookieName = 'original-request';

function isPublicPath(pathname: string): boolean {
	const publicPaths = ['/', '/login', '/api/login', 'api/finish-login'];
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
	if (isPublicPath(context.originPathname)) {
		return next();
	}
	const isAuthed = await auth.api.getSession(context);
	if (!isAuthed) {
		context.cookies.set(originalRequestCookieName, encodeURIComponent(context.originPathname), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
		});
		return context.rewrite(new Request('/login'));
	}
	if (context.originPathname === '/api/finish-login') {
		const originalRequest = context.cookies.get(originalRequestCookieName)?.value;
		const redirectTo = originalRequest ? decodeURIComponent(originalRequest) : '/';
		context.cookies.delete(originalRequestCookieName, { path: '/' });
		return context.redirect(redirectTo, 302);
	}

	return next();
});
