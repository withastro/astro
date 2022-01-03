import type { AstroConfig } from '../../@types/astro';
import type { LogOptions } from '../logger';

import http from 'http';
import { performance } from 'perf_hooks';
import send from 'send';
import { fileURLToPath } from 'url';
import * as msg from '../dev/messages.js';
import { error, info } from '../logger.js';
import { subpathNotUsedTemplate } from '../dev/template/4xx.js';

interface PreviewOptions {
	logging: LogOptions;
}

interface PreviewServer {
	hostname: string;
	port: number;
	server: http.Server;
	stop(): Promise<void>;
}

/** The primary dev action */
export default async function preview(config: AstroConfig, { logging }: PreviewOptions): Promise<PreviewServer> {
	const startServerTime = performance.now();
	const base = config.buildOptions.site ? new URL(config.buildOptions.site).pathname : '/';

	// Create the preview server, send static files out of the `dist/` directory.
	const server = http.createServer((req, res) => {
		if (!req.url!.startsWith(base)) {
			res.statusCode = 404;
			res.end(subpathNotUsedTemplate(base, req.url!));
			return;
		}

		send(req, req.url!.substr(base.length - 1), {
			root: fileURLToPath(config.dist),
		}).pipe(res);
	});

	let { hostname, port } = config.devOptions;

	let httpServer: http.Server;

	/** Expose dev server to `port` */
	function startServer(timerStart: number): Promise<void> {
		let showedPortTakenMsg = false;
		let showedListenMsg = false;
		return new Promise<void>((resolve, reject) => {
			const listen = () => {
				httpServer = server.listen(port, hostname, () => {
					if (!showedListenMsg) {
						info(logging, 'astro', msg.devStart({ startupTime: performance.now() - timerStart }));
						info(logging, 'astro', msg.devHost({ host: `http://${hostname}:${port}${base}` }));
					}
					showedListenMsg = true;
					resolve();
				});
				httpServer?.on('error', onError);
			};

			const onError = (err: NodeJS.ErrnoException) => {
				if (err.code && err.code === 'EADDRINUSE') {
					if (!showedPortTakenMsg) {
						info(logging, 'astro', msg.portInUse({ port }));
						showedPortTakenMsg = true; // only print this once
					}
					port++;
					return listen(); // retry
				} else {
					error(logging, 'astro', err.stack);
					httpServer?.removeListener('error', onError);
					reject(err); // reject
				}
			};

			listen();
		});
	}

	// Start listening on `hostname:port`.
	await startServer(startServerTime);

	return {
		hostname,
		port,
		server: httpServer!,
		stop: async () => {
			httpServer.close();
		},
	};
}
