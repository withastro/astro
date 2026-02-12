import type { RequestHandler } from '../types.js';
import { NodeApp } from 'astro/app/node';
import { manifest } from 'virtual:astro:manifest';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import { createAppHandler } from '../handlers.js';

setGetEnv((key) => process.env[key]);

const app = new NodeApp(manifest, !options.experimentalDisableStreaming);
const appHandler = createAppHandler({
	app,
	experimentalErrorPageHost: options.experimentalErrorPageHost,
	client: options.client,
	server: options.server,
});
const logger = app.getAdapterLogger();

export const ssrHandler: RequestHandler = async (...args) => {
	// assume normal invocation at first
	const [req, res, next, locals] = args;
	// short circuit if it is an error invocation
	if (req instanceof Error) {
		const error = req;
		if (next) {
			return next(error);
		} else {
			throw error;
		}
	}
	try {
		await appHandler(req, res, next, locals);
	} catch (err) {
		logger.error(`Could not render ${req.url}`);
		console.error(err);
		if (!res.headersSent) {
			res.writeHead(500, `Server error`);
			res.end();
		}
	}
};
