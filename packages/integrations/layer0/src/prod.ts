import http from 'http';
import { App } from 'astro/app';
import type { SSRManifest } from 'astro';

export function start(manifest: SSRManifest) {
	const app = new App(manifest);

	addEventListener('fetch', (event) => {
		event.respondWith(app.render(event.request));
	});
}

export function createExports(manifest: SSRManifest) {
	console.log('manifest', manifest);
	return {
		async handler(port: number) {
			const { handler } = await import('../server/entry.mjs');
			const server = http.createServer(handler);
			server.listen(port);
		},
	};
}
