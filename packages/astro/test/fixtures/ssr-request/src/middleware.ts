import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(({ url }, next) => {
	// Redirect when the path matches (duplicate slashes are normalized before middleware runs)
	if(url.pathname === '/this/is/my/directory') {
		return new Response(null, {
			status: 301,
			headers: {
				Location: '/'
			}
		});
	}
	return next();
});
