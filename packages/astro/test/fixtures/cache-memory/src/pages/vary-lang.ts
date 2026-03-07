export const prerender = false;

export const GET = async (context) => {
	const lang = context.request.headers.get('Accept-Language') || 'en';
	context.cache.set({ maxAge: 300, tags: ['vary-test'] });
	return new Response(JSON.stringify({ lang, timestamp: Date.now() }), {
		headers: {
			'Content-Type': 'application/json',
			Vary: 'Accept-Language',
		},
	});
};
