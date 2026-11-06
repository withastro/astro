import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { vitePluginAstroPreview } from '../../../dist/core/preview/vite-plugin-astro-preview.js';
import { createBasicSettings, createRequestAndResponse } from '../test-utils.ts';

type Handler = (req: any, res: any, next: (err?: unknown) => void) => void;

/** Returns the post-middleware that resolves `/foo` and `/foo/` to built HTML files. */
async function getHtmlResolverMiddleware(): Promise<Handler> {
	const settings = await createBasicSettings();
	const handlers: Handler[] = [];
	const server = { middlewares: { use: (fn: Handler) => handlers.push(fn), stack: [] } };
	const plugin = vitePluginAstroPreview(settings) as any;
	const registerPost = plugin.configurePreviewServer(server);
	registerPost();
	return handlers[handlers.length - 1];
}

describe('astro:preview — malformed percent-encoding', async () => {
	const middleware = await getHtmlResolverMiddleware();

	for (const url of ['/fixture/%', '/fixture/%C0%AF', '/fixture/%/']) {
		it(`responds 400 for ${url} instead of throwing`, () => {
			const { req, res } = createRequestAndResponse({ method: 'GET', url });
			let nextCalled = false;
			middleware(req, res, () => {
				nextCalled = true;
			});
			assert.equal(nextCalled, false);
			assert.equal(res.statusCode, 400);
		});
	}

	it('passes valid encoded paths through', () => {
		const { req, res } = createRequestAndResponse({ method: 'GET', url: '/caf%C3%A9' });
		let nextCalled = false;
		middleware(req, res, () => {
			nextCalled = true;
		});
		assert.equal(nextCalled, true);
	});
});
