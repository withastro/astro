import { polyfill } from '@astrojs/webapi';
import type { SSRManifest } from 'astro';
import { NodeApp } from 'astro/app/node';
import type { IncomingMessage, ServerResponse } from 'http';

polyfill(globalThis, {
	exclude: 'window document',
});

export function createExports(manifest: SSRManifest) {
	const app = new NodeApp(manifest);
	return {
		handler: async (req: IncomingMessage, res: ServerResponse) => {
			const start = performance.now();
			await app.render(req);
			const end = performance.now();
			res.write(end - start + '');
			res.end();
		},
	};
}
