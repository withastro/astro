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
		const { req, res, json } = createRequestAndResponse({
			method: 'GET',
			url: '/api/books.html',
		});
		container.handle(req, res);
		const body = await json();

		assert.equal(body.params.category, 'books');
		assert.equal(body.params.id, undefined);
	});

	it('should resolve params correctly for .html requests to nested dynamic routes', async () => {
		const { req, res, json } = createRequestAndResponse({
			method: 'GET',
			url: '/api/books/42.html',
		});
		container.handle(req, res);
		const body = await json();

		assert.equal(body.params.category, 'books');
		assert.equal(body.params.id, '42');
	});

	it('should not cross-contaminate resolved pathnames between concurrent requests', async () => {
		// Fire both requests before awaiting either response.
		// Before the fix, resolvedPathname was stored as shared instance state,
		// so the second request could overwrite the first's pathname.
		const r1 = createRequestAndResponse({ method: 'GET', url: '/api/books/1.html' });
		const r2 = createRequestAndResponse({ method: 'GET', url: '/api/movies/99' });

		container.handle(r1.req, r1.res);
		container.handle(r2.req, r2.res);

		const [body1, body2] = await Promise.all([r1.json(), r2.json()]);

		assert.equal(body1.params.category, 'books');
		assert.equal(body1.params.id, '1');

		assert.equal(body2.params.category, 'movies');
		assert.equal(body2.params.id, '99');
	});
});
