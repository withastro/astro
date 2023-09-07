import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Vercel Web Analytics', () => {
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

		it('ensures that Vercel Web Analytics is present in the header', async () => {
			const pageOne = await fixture.readFile('../.vercel/output/static/one/index.html');
			const pageTwo = await fixture.readFile('../.vercel/output/static/two/index.html');

			expect(pageOne).to.contain('/_vercel/insights/script.js');
			expect(pageTwo).to.contain('/_vercel/insights/script.js');
		});
	});
});
