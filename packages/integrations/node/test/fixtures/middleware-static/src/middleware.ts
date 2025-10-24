import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	const url = new URL(context.request.url);
	
	// Add a header to show middleware ran
	const response = await next();
	response.headers.set('x-middleware-ran', 'true');
	
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
	
	// Handle blocked paths
	if (url.pathname === '/blocked') {
		return new Response('Access denied', { status: 403 });
	}
	
	// Handle redirects
	if (url.pathname === '/redirect-me') {
		return context.redirect('/redirected', 302);
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
