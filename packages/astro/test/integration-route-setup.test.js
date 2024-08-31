import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Integration route setup', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/integration-route-setup/' });
		await fixture.build();
	});

	it('Adds middlewares in dev', async () => {
		const routeInfo = JSON.parse(await fixture.readFile('client/report.json'));

		assert.deepEqual(routeInfo, [
			{
				component: 'src/pages/no-prerender.astro',
				prerender: false,
			},
			{
				component: 'src/pages/prerender.astro',
				prerender: true,
			},
			{
				component: 'src/pages/report.json.js',
			},
		]);
	});
});
