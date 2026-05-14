import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('Astro.clientAddress', () => {
	describe('SSR', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/client-address/',
				output: 'server',
				adapter: testAdapter(),
				outDir: './dist/client-address-ssr/',
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
	});

	describe('SSR adapter not implemented', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/client-address/',
				output: 'server',
				adapter: testAdapter({ provideAddress: false }),
				outDir: './dist/client-address-ssr-adapter-not-implemented/',
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
				outDir: './dist/client-address-ssg/',
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
	});
});
