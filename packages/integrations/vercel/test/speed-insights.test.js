import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Vercel Speed Insights', () => {
	describe('output: server', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/with-speed-insights-enabled/output-as-server/',
				output: 'server',
			});
			await fixture.build();
		});

		it('ensures that Vercel Speed Insights is present in the bundle', async () => {
			const [page] = await fixture.readdir('../.vercel/output/static/_astro');

			const bundle = await fixture.readFile(`../.vercel/output/static/_astro/${page}`);

			assert.match(bundle, /https:\/\/vitals.vercel-analytics.com\/v1\/vitals/);
		});
	});

	describe('output: static', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/with-speed-insights-enabled/output-as-static/',
				output: 'static',
			});
			await fixture.build();
		});

		it('ensures that Vercel Speed Insights is present in the bundle', async () => {
			const [page] = await fixture.readdir('../.vercel/output/static/_astro');

			const bundle = await fixture.readFile(`../.vercel/output/static/_astro/${page}`);

			assert.match(bundle, /https:\/\/vitals.vercel-analytics.com\/v1\/vitals/);
		});
	});
});
