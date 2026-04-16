import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('prerendered error pages routing', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerendered-error-pages/',
		});
		await fixture.build({});
	});

	it('falls back to 404.html', async () => {
		const deploymentConfig = JSON.parse(await fixture.readFile('../.vercel/output/config.json'));
		assert.deepEqual(
			deploymentConfig.routes.find((r: any) => r.status === 404),
			{
				src: '^/.*$',
				dest: '/404.html',
				status: 404,
			},
		);
	});
});
