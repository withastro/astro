import type { SSRManifest } from 'astro';
import type { IncomingMessage, ServerResponse } from 'http';
import { NodeApp } from 'astro/app/node';
import { polyfill } from '@astrojs/webapi';

polyfill(globalThis);

export function createExports(manifest: SSRManifest) {
	const app = new NodeApp(manifest, new URL(import.meta.url));
	return {
		async handler(req: IncomingMessage, res: ServerResponse, next?: (err?: unknown) => void) {
			const route = app.match(req);

			if(route) {
				try {
					/** @type {Response} */
					const response = await app.render(req);
					const html = await response.text();
					res.writeHead(response.status, {
						'Content-Type': 'text/html; charset=utf-8',
						'Content-Length': Buffer.byteLength(html, 'utf-8'),
					});
					res.end(html);
				} catch(err: unknown) {
					if(next) {
						next(err);
					} else {
						throw err;
					}
				}
			} else if(next) {
				return next();
			}
		}
	}
}
