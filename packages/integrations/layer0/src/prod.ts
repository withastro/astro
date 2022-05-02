import type { SSRManifest } from 'astro';
import http from 'http';

export function createExports(manifest: SSRManifest) {
	console.log('manifest', manifest);
	return {
		async handler(port: number) {
			console.log('port', port);
			// const { handler } = await import('../server/index.mjs');
			// const server = http.createServer(handler);
			// server.listen(port);
		},
	};
}
