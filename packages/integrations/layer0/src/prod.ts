import type { SSRManifest } from 'astro';
import http from 'http';

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
