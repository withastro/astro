import type { Context } from '@netlify/functions';
import { setGetEnv } from 'astro/env/setup';
import { middlewareSecret, cacheOnDemandPages } from 'virtual:astro-netlify:config';
import { createApp } from 'astro/app/entrypoint';

setGetEnv((key) => process.env[key]);

const app = createApp();

export function createHandler({ notFoundContent }: { notFoundContent: string | undefined }) {
	return async function handler(request: Request, context: Context): Promise<Response> {
		const routeData = app.match(request);

		if (!routeData && typeof notFoundContent !== 'undefined') {
			return new Response(notFoundContent, {
				status: 404,
				headers: { 'Content-Type': 'text/html; charset=utf-8' },
			});
		}

		let locals: Record<string, unknown> = {};

		const astroLocalsHeader = request.headers.get('x-astro-locals');
		const middlewareSecretHeader = request.headers.get('x-astro-middleware-secret');
		if (astroLocalsHeader) {
			if (middlewareSecretHeader !== middlewareSecret) {
				return new Response('Forbidden', { status: 403 });
			}
			// hide the secret from the rest of user and library code
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

			// any user-provided Cache-Control headers take precedence
			const hasCacheControl = [
				'Cache-Control',
				'CDN-Cache-Control',
				'Netlify-CDN-Cache-Control',
			].some((header) => response.headers.has(header));

			if (isCacheableMethod && !hasCacheControl) {
				// caches this page for up to a year
				response.headers.append('CDN-Cache-Control', 'public, max-age=31536000, must-revalidate');
			}
		}

		return response;
	};
}
