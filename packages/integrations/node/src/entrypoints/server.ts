import { logListeningOn } from '../log-listening-on.js';
import { createAppHandler } from '../serve-app.js';
import { createStaticHandler } from '../serve-static.js';
import { createServer, hostOptions } from '../standalone.js';
import { NodeApp } from 'astro/app/node';
import { manifest } from 'astro:ssr-manifest';
import { setGetEnv } from 'astro/env/setup';
import * as options from 'virtual:astro-node:config';

setGetEnv((key) => process.env[key]);

const app = new NodeApp(manifest, !options.experimentalDisableStreaming);

const port = process.env.PORT ? Number(process.env.PORT) : options.port;
const host = process.env.HOST ?? hostOptions(options.host);
const appHandler = createAppHandler(app, options);
const staticHandler = createStaticHandler(app, options);
const server = createServer(
	(req, res) => {
		try {
			// validate request path
			decodeURI(req.url!);
		} catch {
			res.writeHead(400);
			res.end('Bad request.');
			return;
		}
		staticHandler(req, res, () => appHandler(req, res));
	},
	host,
	port,
);
server.server.listen(port, host);
if (process.env.ASTRO_NODE_LOGGING !== 'disabled') {
	logListeningOn(app.getAdapterLogger(), server.server, host);
}
