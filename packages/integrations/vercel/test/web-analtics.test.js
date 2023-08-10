import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Vercel Web Analytics', () => {
	describe('output: server', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/with-web-analytics-enabled/output-as-server/',
				output: 'server',
			});
			await fixture.build();
		});

		it('ensures that Vercel Web Analytics is present in the bundle', async () => {
			const [page] = await fixture.readdir('../.vercel/output/static/_astro');

			const bundle = await fixture.readFile(`../.vercel/output/static/_astro/${page}`);

			expect(bundle).to.contain('/_vercel/insights');
		});
	});

	describe('output: static', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/with-web-analytics-enabled/output-as-static/',
				output: 'static',
			});
			await fixture.build();
		});

		it('ensures that Vercel Web Analytics is present in the bundle', async () => {
			const [page] = await fixture.readdir('../.vercel/output/static/_astro');

			const bundle = await fixture.readFile(`../.vercel/output/static/_astro/${page}`);

			expect(bundle).to.contain('/_vercel/insights');
		});
	});
});
