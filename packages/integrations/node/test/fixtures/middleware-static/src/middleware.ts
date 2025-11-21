import { defineMiddleware } from 'astro:middleware';

/**
 * Test middleware for static pages with runMiddlewareOnRequest enabled.
 * 
 * Note: This middleware has access to runtime request data (cookies, headers, etc.),
 * but the prerendered page components do NOT. Pages are built at build time and
 * cannot access runtime request context like Astro.cookies or context.locals.
 */
export const onRequest = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	
	// Handle blocked paths BEFORE calling next()
	if (url.pathname === '/blocked') {
		return new Response('Access denied', { status: 403 });
	}
	
	// Handle redirects BEFORE calling next()
	if (url.pathname === '/redirect-me') {
		return context.redirect('/redirected', 302);
	}
	
	// Call next() to get the response
	const response = await next();
	
	// Add a header to show middleware ran
	response.headers.set('x-middleware-ran', 'true');
	
	// Check if locals were set by external middleware (e.g., Express)
	if (context.locals.expressUser) {
		response.headers.set('x-express-user', String(context.locals.expressUser));
	}
	if (context.locals.expressSessionId) {
		response.headers.set('x-express-session', String(context.locals.expressSessionId));
	}
	
	// Handle cookies
	const testCookie = context.cookies.get('test-cookie');
	if (testCookie) {
		response.headers.set('x-cookie-value', testCookie.value);
	}
	
	// Handle user-agent
	const userAgent = context.request.headers.get('user-agent');
	if (userAgent === 'test-agent') {
		response.headers.set('x-user-agent-processed', 'true');
	}
	
	// Handle query parameters
	if (url.searchParams.get('debug') === 'true') {
		response.headers.set('x-debug-mode', 'true');
	}
	
	// Set cookies for specific pages
	if (url.pathname === '/set-cookie-page') {
		context.cookies.set('middleware-cookie', 'value', {
			path: '/',
			httpOnly: true,
		});
	}
	
	return response;
});
