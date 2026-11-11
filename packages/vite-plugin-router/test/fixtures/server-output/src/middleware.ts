export async function onRequest(_context: unknown, next: () => Promise<Response>) {
	const response = await next();
	response.headers.set('x-middleware', 'yes');
	return response;
}
