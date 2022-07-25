import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('AstroConfig - config.mode', () => {
	describe(`output: 'server'`, () => {
		describe('deploy config provided', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					// This is just a random fixture to test, doesn't matter.
					root: './fixtures/astro-basic/',
					adapter: testAdapter(),
					output: 'server',
				});
				await fixture.build();
			});

			it('Builds an SSR-able app', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/');
				const response = await app.render(request);
				expect(response.status).to.equal(200);
				expect(response.headers.get('content-type')).to.equal('text/html');
				const html = await response.text();
				expect(html.length).to.be.greaterThan(0);
			});
		});

		describe('deploy config omitted', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					// This is just a random fixture to test, doesn't matter.
					root: './fixtures/astro-basic/',
					output: 'server'
				});
				
			});

			it('Throws during the build', async () => {
				let built = false;
				try {
					await fixture.build();
					built = true;
				} catch(err) {
					expect(err).to.be.an.instanceOf(Error);
					expect(err.message).to.match(/without an adapter/);
				}

				expect(built).to.equal(false, 'Should not have built');
			});
		});
	});

	describe(`output: 'static'`, () => {
		describe('Deploy config omitted', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					// This is just a random fixture to test, doesn't matter.
					root: './fixtures/astro-basic/',
					output: 'static'
				});
				await fixture.build();
			});

			it('Builds to static HTML', async () => {
				let html;
				try {
					html = await fixture.readFile('/index.html');
				} catch(err) {
					expect(false).to.equal(true, 'Couldnt find the file, which mean it did not build.');
				}
				expect(html.length).to.be.greaterThan(0);
			});
		});

		describe.skip('deploy config provided - TODO, we need adapters to support static mode first', () => {
			/** @type {import('./test-utils').Fixture} */
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					// This is just a random fixture to test, doesn't matter.
					root: './fixtures/astro-basic/',
					adapter: testAdapter(),
					output: 'server'
				});
				await fixture.build();
			});
		});
	});
});
