import { defineMiddleware } from 'astro:middleware';

const AUTH_COOKIE_NAME = 'auth-token';
const REDIRECT_COOKIE_NAME = 'redirect-after-login';

/**
 * Middleware runs only during requests, not during build.
 * 
 * IMPORTANT: While this middleware has access to cookies, headers, and request context,
 * the Astro page components themselves do NOT have access to this runtime data because
 * they are prerendered during the build step. This means:
 * - `Astro.cookies.get()` in page components will always return undefined
 * - `context.locals` set here won't be accessible in page components
 * - Only this middleware can read/write cookies and make decisions based on request data
 * 
 * This is perfect for authentication (redirect to login), but won't work for
 * personalizing page content based on cookies/headers.
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
