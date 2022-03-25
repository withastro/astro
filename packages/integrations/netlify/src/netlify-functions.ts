import { SSRManifest } from 'astro';
import type { Handler } from "@netlify/functions";
import { App } from 'astro/app';
import { polyfill } from '@astrojs/webapi';

polyfill(globalThis, {
	exclude: 'window document',
});

interface Args {
	site?: string;
}

export const createExports = (manifest: SSRManifest, args: Args) => {
	const app = new App(manifest);
	const site = new URL(args.site ?? `https://netlify.com`);

	const handler: Handler = async (event) => {
		const headers = new Headers(event.headers as any);
		const request = new Request(new URL(event.path, site).toString(), {
			method: event.httpMethod,
			headers
		});

		if(!app.match(request)) {
			return {
				statusCode: 404,
				body: 'Not found'
			};
		}

		const response = await app.render(request);
		const body = await response.text();

		return {
			statusCode: 200,
			headers: Object.fromEntries(response.headers.entries()),
			body
		};
	}

	return { handler };
};
