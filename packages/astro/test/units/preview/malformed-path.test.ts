import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { vitePluginAstroPreview } from '../../../dist/core/preview/vite-plugin-astro-preview.js';
import { createBasicSettings, createRequestAndResponse } from '../test-utils.ts';

type Handler = (req: any, res: any, next: (err?: unknown) => void) => void;

/** Returns the post middleware that resolves `/foo` and `/foo/` to built HTML files. */
async function getHtmlResolverMiddleware(): Promise<Handler> {
	const settings = await createBasicSettings();
	const handlers: Handler[] = [];
	const server = { middlewares: { use: (fn: Handler) => handlers.push(fn), stack: [] } };
	const plugin = vitePluginAstroPreview(settings) as any;
	const registerPost = plugin.configurePreviewServer(server);
	registerPost();
	return handlers[handlers.length - 1];
}

function run(middleware: Handler, url: string) {
	const { req, res } = createRequestAndResponse({ method: 'GET', url });
	let nextCalled = false;
	middleware(req, res, () => {
		nextCalled = true;
	});
	return { nextCalled, statusCode: res.statusCode };
}

describe('astro:preview — malformed percent-encoding', async () => {
	const middleware = await getHtmlResolverMiddleware();

	for (const url of ['/%', '/%C0%AF', '/%/']) {
		it(`responds 400 for ${url}`, () => {
			const result = run(middleware, url);
			assert.equal(result.nextCalled, false);
			assert.equal(result.statusCode, 400);
		});
	}

	// Valid encodings, including ones that can't map to a file, fall through to the
	// next middleware (and a 404) instead of a 400 or a thrown error.
	for (const url of ['/caf%C3%A9', '/a%2Fb', '/a%2Fb/', '/a%5Cb']) {
		it(`passes ${url} through`, () => {
			assert.equal(run(middleware, url).nextCalled, true);
		});
	}
});
