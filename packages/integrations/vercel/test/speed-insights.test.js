import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

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

			expect(bundle).to.contain('https://vitals.vercel-analytics.com/v1/vitals');
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

			expect(bundle).to.contain('https://vitals.vercel-analytics.com/v1/vitals');
		});
	});
});
