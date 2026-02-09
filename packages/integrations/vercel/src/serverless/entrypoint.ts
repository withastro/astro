import { setGetEnv } from 'astro/env/setup';
import {
	ASTRO_LOCALS_HEADER,
	ASTRO_MIDDLEWARE_SECRET_HEADER,
	ASTRO_PATH_HEADER,
	ASTRO_PATH_PARAM,
} from '../index.js';
import { middlewareSecret, skewProtection } from 'virtual:astro-vercel:config';
import { createApp } from 'astro/app/entrypoint';

setGetEnv((key) => process.env[key]);

const app = createApp();

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const realPath =
			request.headers.get(ASTRO_PATH_HEADER) ?? url.searchParams.get(ASTRO_PATH_PARAM);
		if (typeof realPath === 'string') {
			url.pathname = realPath;
			request = new Request(url.toString(), {
				method: request.method,
				headers: request.headers,
				body: request.body,
			});
		}

		const routeData = app.match(request);

		let locals: Record<string, unknown> = {};

		const astroLocalsHeader = request.headers.get(ASTRO_LOCALS_HEADER);
		const middlewareSecretHeader = request.headers.get(ASTRO_MIDDLEWARE_SECRET_HEADER);
		if (astroLocalsHeader) {
			if (middlewareSecretHeader !== middlewareSecret) {
				return new Response('Forbidden', { status: 403 });
			}
			// hide the secret from the rest of user code
			request.headers.delete(ASTRO_MIDDLEWARE_SECRET_HEADER);
			locals = JSON.parse(astroLocalsHeader);
		}

		// https://vercel.com/docs/deployments/skew-protection#supported-frameworks
		if (skewProtection && process.env.VERCEL_SKEW_PROTECTION_ENABLED === '1') {
			request.headers.set('x-deployment-id', process.env.VERCEL_DEPLOYMENT_ID!);
		}

		const response = await app.render(request, {
			routeData,
			clientAddress: request.headers.get('x-forwarded-for') ?? undefined,
			locals,
		});

		if (app.setCookieHeaders) {
			for (const setCookieHeader of app.setCookieHeaders(response)) {
				response.headers.append('Set-Cookie', setCookieHeader);
			}
		}

		return response;
	},
};
