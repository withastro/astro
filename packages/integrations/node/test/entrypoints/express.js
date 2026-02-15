// @ts-check
import express from 'express';
import { nodeHandler } from '@astrojs/node/node-handler';

export function startServer() {
	const app = express();
	app.use(nodeHandler);
	return app.listen(8889);
}
