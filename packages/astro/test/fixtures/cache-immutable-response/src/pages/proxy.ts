export const prerender = false;

export const GET = async (context) => {
	context.cache.set({ maxAge: 300, tags: ['proxied'] });
	// Responses returned from fetch() have immutable headers.
	return fetch('data:text/plain,proxied');
};
