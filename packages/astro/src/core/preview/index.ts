import type { AstroConfig } from '../../@types/astro';
import type { LogOptions } from '../logger';
import type { Stats } from 'fs';

import http from 'http';
import { performance } from 'perf_hooks';
import send from 'send';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as msg from '../messages.js';
import { error, info } from '../logger.js';
import { subpathNotUsedTemplate, notFoundTemplate, default as template } from '../../template/4xx.js';
import { appendForwardSlash, trimSlashes } from '../path.js';

interface PreviewOptions {
	logging: LogOptions;
}

export interface PreviewServer {
	hostname: string;
	port: number;
	server: http.Server;
	stop(): Promise<void>;
}

/** The primary dev action */
export default async function preview(config: AstroConfig, { logging }: PreviewOptions): Promise<PreviewServer> {
	const startServerTime = performance.now();
	const pageUrlFormat = config.buildOptions.pageUrlFormat;
	const trailingSlash = config.devOptions.trailingSlash;
	const forceTrailingSlash = trailingSlash === 'always';
	const blockTrailingSlash = trailingSlash === 'never';

	/** Default file served from a directory. */
	const defaultFile = 'index.html';

	const defaultOrigin = 'http://localhost';

	const sendOptions = {
		extensions: pageUrlFormat === 'file' ? ['html'] : false,
		index: false,
		root: fileURLToPath(config.dist),
	};

	/** Base request URL. */
	let baseURL = new URL(config.buildOptions.site || '/', defaultOrigin);

	// Create the preview server, send static files out of the `dist/` directory.
	const server = http.createServer((req, res) => {
		const requestURL = new URL(req.url as string, defaultOrigin);

		// respond 404 to requests outside the base request directory
		if (!requestURL.pathname.startsWith(baseURL.pathname)) {
			res.statusCode = 404;
			res.end(subpathNotUsedTemplate(baseURL.pathname, requestURL.pathname));
			return;
		}

		/** Relative request path. */
		const pathname = requestURL.pathname.slice(baseURL.pathname.length - 1);

		const isRoot = pathname === '/';
		const hasTrailingSlash = isRoot || pathname.endsWith('/');

		let tryTrailingSlash = true;
		let tryHtmlExtension = true;

		let url: URL;

		const onErr = (message: string) => {
			res.statusCode = 404;
			res.end(notFoundTemplate(pathname, message));
		};

		const onStat = (err: NodeJS.ErrnoException | null, stat: Stats) => {
			switch (true) {
				// retry nonexistent paths without an html extension
				case err && tryHtmlExtension && hasTrailingSlash && !blockTrailingSlash:
				case err && tryHtmlExtension && !hasTrailingSlash && !forceTrailingSlash && !pathname.endsWith('.html'):
					tryHtmlExtension = false;
					return fs.stat((url = new URL(url.pathname + '.html', url)), onStat);

				// 404 on nonexistent paths (that are yet handled)
				case err !== null:
					return onErr('Path not found');

				// 404 on directories when a trailing slash is present but blocked
				case stat.isDirectory() && hasTrailingSlash && blockTrailingSlash && !isRoot:
					return onErr('Prohibited trailing slash');

				// 404 on directories when a trailing slash is missing but forced
				case stat.isDirectory() && !hasTrailingSlash && forceTrailingSlash && !isRoot:
					return onErr('Required trailing slash');

				// retry on directories when a default file is missing but allowed (that are yet handled)
				case stat.isDirectory() && tryTrailingSlash:
					tryTrailingSlash = false;
					return fs.stat((url = new URL(url.pathname + (url.pathname.endsWith('/') ? defaultFile : '/' + defaultFile), url)), onStat);

				// 404 on existent directories (that are yet handled)
				case stat.isDirectory():
					return onErr('Path not found');

				// handle existent paths
				default:
					send(req, fileURLToPath(url), {
						extensions: false,
						index: false,
					}).pipe(res);
			}
		};

		fs.stat((url = new URL(trimSlashes(pathname), config.dist)), onStat);
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
						info(logging, 'astro', msg.devHost({ address: { family: 'ipv4', address: hostname, port }, https: false, site: baseURL }));
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
