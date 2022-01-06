import type { AstroConfig } from '../../@types/astro';
import type { LogOptions } from '../logger';

import http from 'http';
import { performance } from 'perf_hooks';
import send from 'send';
import { fileURLToPath } from 'url';
import * as msg from '../dev/messages.js';
import { error, info } from '../logger.js';
import { subpathNotUsedTemplate, default as template } from '../dev/template/4xx.js';
import { prependForwardSlash } from '../path.js';
import * as npath from 'path';
import * as fs from 'fs';


interface PreviewOptions {
	logging: LogOptions;
}

export interface PreviewServer {
	hostname: string;
	port: number;
	server: http.Server;
	stop(): Promise<void>;
}

type SendStreamWithPath = send.SendStream & { path: string };

function removeBase(base: string, pathname: string) {
  if(base === pathname) {
    return '/';
  }
  let requrl = pathname.substr(base.length);
	return prependForwardSlash(requrl);
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

		switch(config.devOptions.trailingSlash) {
			case 'always': {
				if(!req.url?.endsWith('/')) {
					res.statusCode = 404;
					res.end(template({
						title: 'Not found',
						tabTitle: 'Not found',
						pathname: req.url!,
					}));
					return;
				}
				break;
			}
			case 'never': {
				if(req.url?.endsWith('/')) {
					res.statusCode = 404;
					res.end(template({
						title: 'Not found',
						tabTitle: 'Not found',
						pathname: req.url!,
					}));
					return;
				}
				break;
			}
			case 'ignore': {
				break;
			}
		}

		let sendpath = removeBase(base, req.url!);
		const sendOptions: send.SendOptions = {
			root: fileURLToPath(config.dist)
		};
		if(config.buildOptions.pageUrlFormat === 'file' && !sendpath.endsWith('.html')) {
			sendOptions.index = false;
			const parts = sendpath.split('/');
			let lastPart = parts.pop();
			switch(config.devOptions.trailingSlash) {
				case 'always': {
					lastPart = parts.pop();
					break;
				}
				case 'never': {
					// lastPart is the actually last part like `page`
					break;
				}
				case 'ignore': {
					// this could end in slash, so resolve either way
					if(lastPart === '') {
						lastPart = parts.pop();
					}
					break;
				}
			}
			const part = lastPart || 'index';
			sendpath = npath.sep + npath.join(...parts, `${part}.html`);
		}
		send(req, sendpath, sendOptions)
		.once('directory', function(this: SendStreamWithPath, _res, path) {
			if(config.buildOptions.pageUrlFormat === 'directory' && !path.endsWith('index.html')) {
				return this.sendIndex(path);
			} else {
				this.error(404);
			}
		})
		.pipe(res);
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
