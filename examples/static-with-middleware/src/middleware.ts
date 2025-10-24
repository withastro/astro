import { defineMiddleware } from 'astro:middleware';

const AUTH_COOKIE_NAME = 'auth-token';
const REDIRECT_COOKIE_NAME = 'redirect-after-login';

/**
 * Middleware runs only during requests, not during build.
 */
export const onRequest = defineMiddleware(async (context, next) => {
	// Protected paths - require authentication
	const protectedPaths = ['/secret', '/dashboard'];
	const isProtected = protectedPaths.some((path) => context.originPathname.includes(path));

	if (!isProtected) {
		return next();
	}

	// Dummy auth validation
	const authToken = context.cookies.get(AUTH_COOKIE_NAME);
	const isAuthed = authToken?.value === 'valid-token';

	if (!isAuthed) {
		const response = context.redirect('/login');
		context.cookies.set(REDIRECT_COOKIE_NAME, context.originPathname, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 5, // 5 minutes
		});

		return response;
	}

	// User is authenticated, allow access to the page
	return next();
});
