import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Custom 500', () => {
	let fixture: Fixture;

	describe('SSR', () => {
		let app: App;

		it('renders custom 500', async () => {
			fixture = await loadFixture({
				root: './fixtures/custom-500/',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 500);
			assert.equal(response.statusText, 'Internal Server Error');

			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('h1').text(), 'Server error');
			assert.equal($('p').text(), 'some error');
		});

		it('renders nothing if custom 500 throws', async () => {
			fixture = await loadFixture({
				root: './fixtures/custom-500-failing/',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 500);

			const html = await response.text();
			assert.equal(html, '');
		});

		it('renders custom 500 with styles', async () => {
			fixture = await loadFixture({
				root: './fixtures/custom-500/',
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp();

			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 500);

			const html = await response.text();
			const $ = cheerio.load(html);

			// Check that styles from 500.astro are included
			// Note: Colors are minified (#ffcccc -> #fcc, #cc0000 -> #c00)
			const styles = $('style').text();
			assert.match(styles, /background-color.*#fcc/);
			assert.match(styles, /color.*#c00/);
			assert.match(styles, /font-family.*monospace/);
		});
	});
});
