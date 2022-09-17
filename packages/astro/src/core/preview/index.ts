import type { AstroTelemetry } from '@astrojs/telemetry';
import type { AddressInfo } from 'net';
import type { AstroSettings } from '../../@types/astro';
import type { LogOptions } from '../logger/core';

import fs from 'fs';
import http from 'http';
import { performance } from 'perf_hooks';
import sirv from 'sirv';
import { fileURLToPath } from 'url';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import { error, info } from '../logger/core.js';
import * as msg from '../messages.js';
import { getResolvedHostForHttpServer } from './util.js';

interface PreviewOptions {
	logging: LogOptions;
	telemetry: AstroTelemetry;
}

export interface PreviewServer {
	host?: string;
	port: number;
	server: http.Server;
	closed(): Promise<void>;
	stop(): Promise<void>;
}

const HAS_FILE_EXTENSION_REGEXP = /^.*\.[^\\]+$/;

/** The primary dev action */
export default async function preview(
	settings: AstroSettings,
	{ logging }: PreviewOptions
): Promise<PreviewServer> {
	if (settings.config.output === 'server') {
		throw new Error(
			`[preview] 'output: server' not supported. Use your deploy platform's preview command directly instead, if one exists. (ex: 'netlify dev', 'vercel dev', 'wrangler', etc.)`
		);
	}
	const startServerTime = performance.now();
	const defaultOrigin = 'http://localhost';
	const trailingSlash = settings.config.trailingSlash;
	/** Base request URL. */
	let baseURL = new URL(settings.config.base, new URL(settings.config.site || '/', defaultOrigin));
	const staticFileServer = sirv(fileURLToPath(settings.config.outDir), {
		dev: true,
		etag: true,
		maxAge: 0,
	});
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

		function sendError(message: string) {
			res.statusCode = 404;
			res.end(notFoundTemplate(pathname, message));
		}

		switch (true) {
			case hasTrailingSlash && trailingSlash == 'never' && !isRoot:
				sendError('Not Found (trailingSlash is set to "never")');
				return;
			case !hasTrailingSlash &&
				trailingSlash == 'always' &&
				!isRoot &&
				!HAS_FILE_EXTENSION_REGEXP.test(pathname):
				sendError('Not Found (trailingSlash is set to "always")');
				return;
			default: {
				// HACK: rewrite req.url so that sirv finds the file
				req.url = '/' + req.url?.replace(baseURL.pathname, '');
				staticFileServer(req, res, () => {
					const errorPagePath = fileURLToPath(settings.config.outDir + '/404.html');
					if (fs.existsSync(errorPagePath)) {
						res.statusCode = 404;
						res.setHeader('Content-Type', 'text/html;charset=utf-8');
						res.end(fs.readFileSync(errorPagePath));
					} else {
						staticFileServer(req, res, () => {
							sendError('Not Found');
						});
					}
				});
				return;
			}
		}
	});

	let { port } = settings.config.server;
	const host = getResolvedHostForHttpServer(settings.config.server.host);

	let httpServer: http.Server;

	/** Expose dev server to `port` */
	function startServer(timerStart: number): Promise<void> {
		let showedPortTakenMsg = false;
		let showedListenMsg = false;
		return new Promise<void>((resolve, reject) => {
			const listen = () => {
				httpServer = server.listen(port, host, async () => {
					if (!showedListenMsg) {
						const resolvedUrls = msg.resolveServerUrls({
							address: server.address() as AddressInfo,
							host: settings.config.server.host,
							https: false,
						});
						info(
							logging,
							null,
							msg.serverStart({
								startupTime: performance.now() - timerStart,
								resolvedUrls,
								host: settings.config.server.host,
								site: baseURL,
							})
						);
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
					error(logging, 'astro', err.stack || err.message);
					httpServer?.removeListener('error', onError);
					reject(err); // reject
				}
			};

			listen();
		});
	}

	// Start listening on `hostname:port`.
	await startServer(startServerTime);

	// Resolves once the server is closed
	function closed() {
		return new Promise<void>((resolve, reject) => {
			httpServer!.addListener('close', resolve);
			httpServer!.addListener('error', reject);
		});
	}

	return {
		host,
		port,
		closed,
		server: httpServer!,
		stop: async () => {
			await new Promise((resolve, reject) => {
				httpServer.close((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	};
}
