import { SSRManifest } from 'astro';
import type { Handler } from '@netlify/functions';
import { App } from 'astro/app';
import { polyfill } from '@astrojs/webapi';

polyfill(globalThis, {
	exclude: 'window document',
});

interface Args {}

export const createExports = (manifest: SSRManifest, args: Args) => {
	const app = new App(manifest);

	const handler: Handler = async (event) => {
		const { httpMethod, headers, rawUrl, body: requestBody, isBase64Encoded } = event;
		const init: RequestInit = {
			method: httpMethod,
			headers: new Headers(headers as any),
		};
		// Attach the event body the the request, with proper encoding.
		if (httpMethod !== 'GET' && httpMethod !== 'HEAD') {
			const encoding = isBase64Encoded ? 'base64' : 'utf-8';
			init.body =
				typeof requestBody === 'string' ? Buffer.from(requestBody, encoding) : requestBody;
		}
		const request = new Request(rawUrl, init);

		if (!app.match(request)) {
			return {
				statusCode: 404,
				body: 'Not found',
			};
		}

		const response = await app.render(request);
		const responseBody = await response.text();

		return {
			statusCode: 200,
			headers: Object.fromEntries(response.headers.entries()),
			body: responseBody,
		};
	};

	return { handler };
};
