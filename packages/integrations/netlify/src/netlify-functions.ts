import { polyfill } from '@astrojs/webapi';
import type { Handler } from '@netlify/functions';
import { SSRManifest } from 'astro';
import { App } from 'astro/app';

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

		const response: Response = await app.render(request);
		const responseBody = await response.text();

		const responseHeaders = Object.fromEntries(response.headers.entries());
		const fnResponse: any = {
			statusCode: response.status,
			headers: responseHeaders,
			body: responseBody,
		};

		// Special-case set-cookie which has to be set an different way :/
		// The fetch API does not have a way to get multiples of a single header, but instead concatenates
		// them. There are non-standard ways to do it, and node-fetch gives us headers.raw()
		// See https://github.com/whatwg/fetch/issues/973 for discussion
		if (response.headers.has('set-cookie') && 'raw' in response.headers) {
			// Node fetch allows you to get the raw headers, which includes multiples of the same type.
			// This is needed because Set-Cookie *must* be called for each cookie, and can't be
			// concatenated together.
			type HeadersWithRaw = Headers & {
				raw: () => Record<string, string[]>;
			};

			const rawPacked = (response.headers as HeadersWithRaw).raw();
			if ('set-cookie' in rawPacked) {
				fnResponse.multiValueHeaders = {
					'set-cookie': rawPacked['set-cookie'],
				};
			}
		}

		return fnResponse;
	};

	return { handler };
};
