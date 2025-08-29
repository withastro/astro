import type { MiddlewareHandler } from 'astro';

// Generate a simple request ID for testing
function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Simple middleware for testing tracing
export const onRequest: MiddlewareHandler = async (context, next) => {
	// Add some data to locals for testing
	context.locals.requestId = generateRequestId();
	context.locals.middlewareData = {
		timestamp: new Date().toISOString(),
		pathname: context.url.pathname,
		method: context.request.method,
		userAgent: context.request.headers.get('user-agent'),
	};

	// Log middleware execution (for debugging)
	console.log(`[Middleware] Processing request: ${context.request.method} ${context.url.pathname}`);

	// Call the next middleware or page
	const response = await next();

	// Add a custom header to verify middleware ran
	response.headers.set('X-Middleware-Processed', 'true');
	response.headers.set('X-Request-ID', context.locals.requestId);

	return response;
};
