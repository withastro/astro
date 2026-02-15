// @ts-check
import { H3, fromWebHandler, serve } from 'h3';
import { webHandler } from '@astrojs/node/web-handler';

export function startServer() {
	const app = new H3();
	app.use(fromWebHandler(webHandler));
	return serve(app, { port: 8889 });
}
