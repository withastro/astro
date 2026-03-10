export const prerender = false;

export const GET = async (context) => {
	context.cache.set({ maxAge: 300, tags: ['cookie'] });
	const response = Response.json({ timestamp: Date.now(), nonce: Math.random() });
	response.headers.set('Set-Cookie', 'session=test; Path=/; HttpOnly');
	return response;
};
