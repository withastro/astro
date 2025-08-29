import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url, locals }) => {
	// Simple API endpoint for testing tracing
	const timestamp = new Date().toISOString();
	const requestId = locals.requestId || 'no-request-id';

	// Simulate some processing time
	await new Promise(resolve => setTimeout(resolve, 10));

	const responseData = {
		message: 'API endpoint test successful',
		timestamp,
		requestId,
		method: request.method,
		url: url.href,
		pathname: url.pathname,
		searchParams: Object.fromEntries(url.searchParams.entries()),
		headers: Object.fromEntries(request.headers.entries()),
		middlewareProcessed: request.headers.get('x-middleware-processed') === 'true',
	};

	return new Response(JSON.stringify(responseData, null, 2), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'X-API-Response': 'true',
			'X-Timestamp': timestamp,
		},
	});
};

export const POST: APIRoute = async ({ request, locals }) => {
	const timestamp = new Date().toISOString();
	const requestId = locals.requestId || 'no-request-id';

	let body;
	try {
		body = await request.json();
	} catch {
		body = await request.text();
	}

	const responseData = {
		message: 'POST request processed',
		timestamp,
		requestId,
		receivedBody: body,
		contentType: request.headers.get('content-type'),
	};

	return new Response(JSON.stringify(responseData, null, 2), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'X-API-Response': 'true',
		},
	});
};
