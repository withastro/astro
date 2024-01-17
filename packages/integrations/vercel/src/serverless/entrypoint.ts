import type { SSRManifest } from 'astro';
import { applyPolyfills, NodeApp } from 'astro/app/node';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ASTRO_LOCALS_HEADER } from './adapter.js';

applyPolyfills();

export const createExports = (manifest: SSRManifest) => {
	const app = new NodeApp(manifest);
	const handler = async (req: IncomingMessage, res: ServerResponse) => {
		const clientAddress = req.headers['x-forwarded-for'] as string | undefined;
		const localsHeader = req.headers[ASTRO_LOCALS_HEADER];
		const locals =
			typeof localsHeader === 'string'
				? JSON.parse(localsHeader)
				: Array.isArray(localsHeader)
					? JSON.parse(localsHeader[0])
					: {};
		const webResponse = await app.render(req, { locals, clientAddress });
		await NodeApp.writeResponse(webResponse, res);
	};

	return { default: handler };
};
