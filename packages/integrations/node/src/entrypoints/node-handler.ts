import type { RequestHandler } from '../types.js';
import { createApp } from 'astro/app/entrypoint';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';
import { createAppHandler } from '../serve-app.js';

setGetEnv((key) => process.env[key]);

const app = createApp({ streaming: !options.experimentalDisableStreaming });
const appHandler = createAppHandler(app, options);
const logger = app.getAdapterLogger();

export const nodeHandler: RequestHandler = async (...args) => {
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
