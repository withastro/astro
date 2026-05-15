import { setGetEnv } from 'astro/env/setup';
import { middlewareSecret, cacheOnDemandPages } from 'virtual:astro-netlify:config';
import { createApp } from 'astro/app/entrypoint';
setGetEnv((key) => process.env[key]);
const app = createApp();
function createHandler({ notFoundContent }) {
	return async function handler(request, context) {
		const routeData = app.match(request);
		if (!routeData && typeof notFoundContent !== 'undefined') {
			return new Response(notFoundContent, {
				status: 404,
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		}
		let locals = {};
		const astroLocalsHeader = request.headers.get('x-astro-locals');
		const middlewareSecretHeader = request.headers.get('x-astro-middleware-secret');
		if (astroLocalsHeader) {
			if (middlewareSecretHeader !== middlewareSecret) {
				return new Response('Forbidden', { status: 403 });
			}
			request.headers.delete('x-astro-middleware-secret');
			locals = JSON.parse(astroLocalsHeader);
		}
		locals.netlify = { context };
		const response = await app.render(request, {
			routeData,
			locals,
			clientAddress: context.ip,
		});
		if (app.setCookieHeaders) {
			for (const setCookieHeader of app.setCookieHeaders(response)) {
				response.headers.append('Set-Cookie', setCookieHeader);
			}
		}
		if (cacheOnDemandPages) {
			const isCacheableMethod = ['GET', 'HEAD'].includes(request.method);
			const hasCacheControl = [
				'Cache-Control',
				'CDN-Cache-Control',
				'Netlify-CDN-Cache-Control',
			].some((header) => response.headers.has(header));
			if (isCacheableMethod && !hasCacheControl) {
				response.headers.append('CDN-Cache-Control', 'public, max-age=31536000, must-revalidate');
			}
		}
		return response;
	};
}
export { createHandler };
