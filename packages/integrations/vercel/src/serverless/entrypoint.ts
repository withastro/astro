import type { SSRManifest } from 'astro';
import { applyPolyfills, NodeApp } from 'astro/app/node';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ASTRO_PATH_HEADER, ASTRO_PATH_PARAM, ASTRO_LOCALS_HEADER } from './adapter.js';

applyPolyfills();

export const createExports = (manifest: SSRManifest) => {
	const app = new NodeApp(manifest);
	const handler = async (req: IncomingMessage, res: ServerResponse) => {
		const url = new URL(`https://example.com${req.url}`)
		const clientAddress = req.headers['x-forwarded-for'] as string | undefined;
		const localsHeader = req.headers[ASTRO_LOCALS_HEADER];
		const realPath = req.headers[ASTRO_PATH_HEADER] ?? url.searchParams.get(ASTRO_PATH_PARAM);
		if (typeof realPath === 'string') {
			req.url = realPath;
		}
		const locals =
			typeof localsHeader === 'string'
				? JSON.parse(localsHeader)
				: Array.isArray(localsHeader)
					? JSON.parse(localsHeader[0])
					: {};
		const webResponse = await app.render(req, { addCookieHeader: true, clientAddress, locals });
		await NodeApp.writeResponse(webResponse, res);
	};

	return { default: handler };
};

// HACK: prevent warning
// @astrojs-ssr-virtual-entry (22:23) "start" is not exported by "dist/serverless/entrypoint.js", imported by "@astrojs-ssr-virtual-entry".
export function start() {}
