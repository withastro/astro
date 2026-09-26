import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture, getVercelConfig } from './test-utils.ts';

describe('middleware URL rewriting (server output)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/middleware-rewrite/',
		});
		await fixture.build({});
	});

	it('does not force a 404 on the catch-all route for a server-rendered 404 page', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);
		const catchAll = routes.find((route) => route.src === '^/.*$');
		assert.ok(catchAll, 'expected a catch-all fallback route');
		assert.equal(catchAll.dest, '_render');
		assert.equal(catchAll.status, undefined);
	});

	it('has no platform-imposed 404 route when the 404 page is server-rendered', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);
		assert.equal(routes.some((route) => route.status === 404), false);
	});
});
