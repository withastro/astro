import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createManifest, createRouteInfo } from './test-helpers.ts';

/**
 * Tests that a request path containing an invalid percent-sequence (one that is not
 * valid UTF-8, e.g. `%C0%AF`) does not crash route matching.
 *
 * `App.match()` decodes the pathname with `decodeURI()`, which throws
 * `URIError: URI malformed` on such input. Because matching happens before
 * `App.render()`, that error used to escape the adapter request handler as an
 * uncaught exception (HTTP 500) that user middleware could not catch. These paths
 * are extremely common from automated path-traversal / `.env` scanners.
 */

const routeOptions: Parameters<typeof parseRoute>[1] = {
	config: { base: '/', trailingSlash: 'ignore' },
	pageExtensions: [],
} as any;

const indexRouteData = parseRoute('index.astro', routeOptions, {
	component: 'src/pages/index.astro',
});

const page = createComponent((_result: any, _props: any, _slots: any) => {
	return render`<h1>Page</h1>`;
});

const pageModule = async () => ({
	page: async () => ({
		default: page,
	}),
});

const pageMap = new Map([[indexRouteData.component, pageModule]]);

const app = new App(
	createManifest({
		routes: [createRouteInfo(indexRouteData)],
		pageMap: pageMap as any,
	}) as any,
);

describe('Malformed URI handling in App.match', () => {
	it('match() does not throw on an invalid percent-sequence', () => {
		const request = new Request('http://example.com/%C0%AF');
		assert.doesNotThrow(() => app.match(request));
		assert.equal(app.match(request), undefined, 'no route should match a malformed path');
	});

	it('render() returns a 404 for a malformed percent-sequence', async () => {
		const request = new Request('http://example.com/%C0%AF');
		const response = await app.render(request);
		assert.equal(
			response.status,
			404,
			'a malformed path must resolve to a normal 404, not an uncaught 500',
		);
	});

	it('valid routes still match', () => {
		const request = new Request('http://example.com/');
		assert.ok(app.match(request), '/ should still match');
	});
});
