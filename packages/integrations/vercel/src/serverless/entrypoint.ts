import { setGetEnv } from 'astro/env/setup';
import {
	ASTRO_LOCALS_HEADER,
	ASTRO_MIDDLEWARE_SECRET_HEADER,
	ASTRO_PATH_HEADER,
	ASTRO_PATH_PARAM,
} from '../index.js';
import { middlewareSecret, skewProtection } from 'virtual:astro-vercel:config';
import { createApp } from 'astro/app/entrypoint';
import { getClientIpAddress } from '@astrojs/internal-helpers/request';

setGetEnv((key) => process.env[key]);

const app = createApp();

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const middlewareSecretHeader = request.headers.get(ASTRO_MIDDLEWARE_SECRET_HEADER);
		const hasValidMiddlewareSecret = middlewareSecretHeader === middlewareSecret;
		let realPath = undefined;
		if (hasValidMiddlewareSecret) {
			realPath = request.headers.get(ASTRO_PATH_HEADER);
		} else if (request.headers.get('x-vercel-isr') === '1') {
			realPath = url.searchParams.get(ASTRO_PATH_PARAM);
		}
		if (typeof realPath === 'string') {
			url.pathname = realPath;
			request = new Request(url.toString(), {
				method: request.method,
				headers: request.headers,
				...(request.body ? { body: request.body, duplex: 'half' } : {}),
			});
		}

		const routeData = app.match(request);

		let locals: Record<string, unknown> = {};

		const astroLocalsHeader = request.headers.get(ASTRO_LOCALS_HEADER);
		if (astroLocalsHeader) {
			if (!hasValidMiddlewareSecret) {
				return new Response('Forbidden', { status: 403 });
			}
			locals = JSON.parse(astroLocalsHeader);
		}

		// hide the secret from the rest of user code
		if (hasValidMiddlewareSecret) {
			request.headers.delete(ASTRO_MIDDLEWARE_SECRET_HEADER);
		}

		// https://vercel.com/docs/deployments/skew-protection#supported-frameworks
		if (skewProtection && process.env.VERCEL_SKEW_PROTECTION_ENABLED === '1') {
			request.headers.set('x-deployment-id', process.env.VERCEL_DEPLOYMENT_ID!);
		}

		const response = await app.render(request, {
			routeData,
			clientAddress: getClientIpAddress(request),
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
