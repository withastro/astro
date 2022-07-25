import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import { nodeLogDestination } from '../dist/core/logger/node.js';
import * as cheerio from 'cheerio';

describe('Astro.clientAddress', () => {
	describe('SSR', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/client-address/',
				output: 'server',
				adapter: testAdapter(),
			});
		});

		describe('Production', () => {
			before(async () => {
				await fixture.build();
			});

			it('Can get the address', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/');
				const response = await app.render(request);
				const html = await response.text();
				const $ = cheerio.load(html);
				expect($('#address').text()).to.equal('0.0.0.0');
			});
		});

		describe('Development', () => {
			/** @type {import('./test-utils').DevServer} */
			let devServer;

			before(async () => {
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer.stop();
			});

			it('Gets the address', async () => {
				let res = await fixture.fetch('/');
				expect(res.status).to.equal(200);
				let html = await res.text();
				let $ = cheerio.load(html);
				let address = $('#address');

				// Just checking that something is here. Not specifying address as it
				// might differ per machine.
				expect(address.length).to.be.greaterThan(0);
			});
		});
	});

	describe('SSR adapter not implemented', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/client-address/',
				output: 'server',
				adapter: testAdapter({ provideAddress: false }),
			});
			await fixture.build();
		});

		it('Gets an error message', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			expect(response.status).to.equal(500);
		});
	});

	describe('SSG', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/client-address/',
				output: 'static',
			});
		});

		describe('Build', () => {
			it('throws during generation', async () => {
				try {
					await fixture.build();
					expect(false).to.equal(true, 'Build should not have completed');
				} catch (err) {
					expect(err.message).to.match(
						/Astro\.clientAddress/,
						'Error message mentions Astro.clientAddress'
					);
				}
			});
		});

		describe('Development', () => {
			/** @type {import('./test-utils').DevServer} */
			let devServer;

			before(async () => {
				// We expect an error, so silence the output
				const logging = {
					dest: nodeLogDestination,
					level: 'silent',
				};
				devServer = await fixture.startDevServer({ logging });
			});

			after(async () => {
				await devServer.stop();
			});

			it('is not accessible', async () => {
				let res = await fixture.fetch('/');
				expect(res.status).to.equal(500);
			});
		});
	});
});
