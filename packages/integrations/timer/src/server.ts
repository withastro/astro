import { polyfill } from '@astrojs/webapi';
import type { SSRManifest } from 'astro';
import { NodeApp } from 'astro/app/node';

polyfill(globalThis, {
	exclude: 'window document',
});

export function createExports(manifest: SSRManifest) {
	const app = new NodeApp(manifest);
	return {
		handler: async (req, res) => {
			const start = performance.now();
			await app.render(req);
			const end = performance.now();
			res.write(end - start + '');
			res.end();
		},
	};
}
