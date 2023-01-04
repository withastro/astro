import type { AstroSettings } from '../../@types/astro';
import type { LogOptions } from '../logger/core';

import fs from 'fs';
import http, { OutgoingHttpHeaders } from 'http';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { preview, type PreviewServer as VitePreviewServer } from 'vite';
import { notFoundTemplate, subpathNotUsedTemplate } from '../../template/4xx.js';
import { error, info } from '../logger/core.js';
import * as msg from '../messages.js';

export interface PreviewServer {
	host?: string;
	port: number;
	server: http.Server;
	closed(): Promise<void>;
	stop(): Promise<void>;
}

const HAS_FILE_EXTENSION_REGEXP = /^.*\.[^\\]+$/;

/** The primary dev action */
export default async function createStaticPreviewServer(
	settings: AstroSettings,
	{
		logging,
		host,
		port,
		headers,
	}: {
		logging: LogOptions;
		host: string | undefined;
		port: number;
		headers: OutgoingHttpHeaders | undefined;
	}
): Promise<PreviewServer> {
	const startServerTime = performance.now();
	const baseURL = new URL(
		settings.config.base,
		new URL(settings.config.site || '/', 'http://localhost')
	);
	const trailingSlash = settings.config.trailingSlash;

	let previewServer: VitePreviewServer;
	try {
		previewServer = await preview({
			configFile: false,
			base: settings.config.base,
			appType: 'mpa',
			build: {
				outDir: fileURLToPath(settings.config.outDir),
			},
			preview: {
				host,
				port,
				headers,
			},
			plugins: [
				{
					name: 'astro:static-preview',
					apply: 'serve',
					configurePreviewServer(server) {
						server.middlewares.use((req, res, next) => {
							// respond 404 to requests outside the base request directory
							if (!req.url!.startsWith(baseURL.pathname)) {
								res.statusCode = 404;
								res.end(subpathNotUsedTemplate(baseURL.pathname, req.url!));
								return;
							}

							/** Relative request path. */
							const pathname = req.url!.slice(settings.config.base.length - 1);

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
							}
							next();
						});

						return () => {
							server.middlewares.use((req, res) => {
								const errorPagePath = fileURLToPath(settings.config.outDir + '/404.html');
								if (fs.existsSync(errorPagePath)) {
									res.statusCode = 404;
									res.setHeader('Content-Type', 'text/html;charset=utf-8');
									res.end(fs.readFileSync(errorPagePath));
								} else {
									res.statusCode = 404;
									res.end(notFoundTemplate(req.originalUrl!, 'Not Found'));
								}
							});
						};
					},
				},
			],
		});
	} catch (err) {
		if (err instanceof Error) {
			error(logging, 'astro', err.stack || err.message);
		}
		throw err;
	}

	info(
		logging,
		null,
		msg.serverStart({
			startupTime: performance.now() - startServerTime,
			resolvedUrls: previewServer.resolvedUrls,
			host: settings.config.server.host,
			site: baseURL,
		})
	);

	// Resolves once the server is closed
	function closed() {
		return new Promise<void>((resolve, reject) => {
			previewServer.httpServer.addListener('close', resolve);
			previewServer.httpServer.addListener('error', reject);
		});
	}

	return {
		host,
		port,
		closed,
		server: previewServer.httpServer,
		stop: async () => {
			await new Promise((resolve, reject) => {
				previewServer.httpServer.close((err) => (err ? reject(err) : resolve(undefined)));
			});
		},
	};
}
