import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { createContainer } from '../../../dist/core/dev/container.js';
import testAdapter from '../../test-adapter.js';
import {
	createBasicSettings,
	createFixture,
	createRequestAndResponse,
	defaultLogger,
} from '../test-utils.js';

const fileSystem = {
	'/src/pages/api/[category]/[id].ts': `
		export const prerender = false;
		export function GET({ params, url }) {
			return Response.json({ params, pathname: url.pathname });
		}
	`,
	'/src/pages/api/[category]/index.ts': `
		export const prerender = false;
		export function GET({ params, url }) {
			return Response.json({ params, pathname: url.pathname });
		}
	`,
};

describe('Resolved pathname in dev server', () => {
	let container;

	before(async () => {
		const fixture = await createFixture(fileSystem);
		const settings = await createBasicSettings({
			root: fixture.path,
			output: 'server',
			adapter: testAdapter(),
			trailingSlash: 'never',
		});
		container = await createContainer({
			settings,
			logger: defaultLogger,
		});
	});

	after(async () => {
		await container.close();
	});

	it('should resolve params correctly for .html requests to dynamic routes', async () => {
		// Requesting /api/books.html should resolve to /api/books via .html stripping,
		// and the [category] param should be "books" (not "books.html")
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/api/books.html',
		});
		container.handle(req, res);
		const body = JSON.parse(await text());

		assert.equal(body.params.category, 'books');
		assert.equal(body.params.id, undefined);
	});

	it('should resolve params correctly for .html requests to nested dynamic routes', async () => {
		// Requesting /api/books/42.html should resolve to /api/books/42,
		// with category="books" and id="42" (not "42.html")
		const { req, res, text } = createRequestAndResponse({
			method: 'GET',
			url: '/api/books/42.html',
		});
		container.handle(req, res);
		const body = JSON.parse(await text());

		assert.equal(body.params.category, 'books');
		assert.equal(body.params.id, '42');
	});

	it('should not cross-contaminate resolved pathnames between requests', async () => {
		// First request: /api/books/1.html → resolvedPathname=/api/books/1
		const req1 = createRequestAndResponse({ method: 'GET', url: '/api/books/1.html' });
		container.handle(req1.req, req1.res);
		const body1 = JSON.parse(await req1.text());

		assert.equal(body1.params.category, 'books');
		assert.equal(body1.params.id, '1');

		// Second request: /api/movies/99 (no .html, resolvedPathname=undefined)
		const req2 = createRequestAndResponse({ method: 'GET', url: '/api/movies/99' });
		container.handle(req2.req, req2.res);
		const body2 = JSON.parse(await req2.text());

		// Before the fix, resolvedPathname from req1 (/api/books/1) could leak into req2,
		// causing a pathname/routeData mismatch. After the fix, each request is independent.
		assert.equal(body2.params.category, 'movies');
		assert.equal(body2.params.id, '99');
	});
});
