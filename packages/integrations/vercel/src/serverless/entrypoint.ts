import { polyfill } from '@astrojs/webapi';
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import type { IncomingMessage, ServerResponse } from 'node:http';

import * as requestTransformLegacy from './request-transform/legacy.js';
import * as requestTransformNode18 from './request-transform/node18.js';

polyfill(globalThis, {
	exclude: 'window document',
});

// Node 18+ has a new API for request/response, while older versions use node-fetch
// When we drop support for Node 14, we can remove the legacy code by switching to undici

const nodeVersion = parseInt(process.version.split('.')[0].slice(1)); // 'v14.17.0' -> 14

const { getRequest, setResponse } =
	nodeVersion >= 18 ? requestTransformNode18 : requestTransformLegacy;

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

		await setResponse(app, res, await app.render(request, routeData));
	};

	return { default: handler };
};
