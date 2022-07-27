import { polyfill } from '@astrojs/webapi';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { getRequest, setResponse } from './request-transform.js';

polyfill(globalThis, {
	exclude: 'window document',
});

export const createExports = (manifest: SSRManifest) => {
	const app = new App(manifest);

	const handler = async (req: IncomingMessage, res: ServerResponse) => {
		let request: Request;

		try {
			request = await getRequest(`https://${req.headers.host}`, req);
		} catch (err: any) {
			res.statusCode = err.status || 400;
			return res.end(err.reason || 'Invalid request body');
		}

		let routeData = app.match(request, { matchNotFound: true });
		if (!routeData) {
			res.statusCode = 404;
			return res.end('Not found');
		}

		await setResponse(res, await app.render(request, routeData));
	};

	return { default: handler };
};
