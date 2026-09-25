import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture, getVercelConfig } from './test-utils.ts';

describe('server-rendered error pages routing', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/server-rendered-error-pages/',
		});
		await fixture.build({});
	});

	it('catch-all forwards to the function without forcing a status', { timeout: 30000 }, async () => {
		const deploymentConfig = await getVercelConfig(fixture);
		const catchAll = deploymentConfig.routes.find(
			(r) => r.src === '^/.*$' && typeof r.dest === 'string',
		);
		assert.ok(catchAll, 'catch-all route exists');
		assert.equal(catchAll.dest, '_render');
		assert.equal(catchAll.status, undefined, 'status must not be forced when the 404 page is server-rendered');
	});
});
