import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { loadFixture, type DevServer, type Fixture } from './test-utils.ts';

describe('Astro.clientAddress', () => {
	describe('SSR', () => {
		let fixture: Fixture;

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
				assert.equal($('#address').text(), '0.0.0.0');
			});

			it('app.render can provide the address', async () => {
				const app = await fixture.loadTestAdapterApp();
				const request = new Request('http://example.com/');
				const response = await app.render(request, { clientAddress: '1.1.1.1' });
				const html = await response.text();
				const $ = cheerio.load(html);
				assert.equal($('#address').text(), '1.1.1.1');
			});
		});

		describe('Development', () => {
			let devServer: DevServer;

			before(async () => {
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer.stop();
			});

			it('Gets the address', async () => {
				let res = await fixture.fetch('/');
				assert.equal(res.status, 200);
				let html = await res.text();
				let $ = cheerio.load(html);
				let address = $('#address');

				// Just checking that something is here. Not specifying address as it
				// might differ per machine.
				assert.equal(address.length > 0, true);
			});
		});
	});

	describe('SSR adapter not implemented', () => {
		let fixture: Fixture;

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
			assert.equal(response.status, 500);
		});
	});

	describe('SSG', () => {
		let fixture: Fixture;

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
					assert.equal(false, true, 'Build should not have completed');
				} catch (err) {
					assert.match(
						(err as Error).message,
						/Astro\.clientAddress/,
						'Error message mentions Astro.clientAddress',
					);
				}
			});
		});

		describe('Development', () => {
			let devServer: DevServer;

			before(async () => {
				devServer = await fixture.startDevServer();
			});

			after(async () => {
				await devServer.stop();
			});

			it('is not accessible', async () => {
				let res = await fixture.fetch('/');
				assert.equal(res.status, 500);
			});
		});
	});
});
