import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { getSharedFixture } from './shared-fixture.js';

async function fetchHTML(fixture, path) {
	const app = await fixture.loadTestAdapterApp();
	const request = new Request('http://example.com' + path);
	const response = await app.render(request);
	const html = await response.text();
	return html;
}

describe('SSR - Inline Scripts', () => {
	describe('without base path', () => {
		let fixture;

		before(async () => {
			fixture = await getSharedFixture({
				name: 'ssr-inline-scripts-no-base',
				root: './fixtures/ssr/',
				output: 'server',
				adapter: testAdapter(),
				outDir: './dist/inline-scripts-without-base-path',
			});
			await fixture.build();
		});

		it('scripts get included', async () => {
			const html = await fetchHTML(fixture, '/scripts/inline');
			const $ = cheerioLoad(html);
			assert.equal($('script').length, 1);
		});
	});

	describe('with base path', () => {
		const base = '/hello';
		let fixture;

		before(async () => {
			fixture = await getSharedFixture({
				name: 'ssr-inline-scripts-with-base',
				root: './fixtures/ssr/',
				output: 'server',
				adapter: testAdapter(),
				outDir: './dist/inline-scripts-with-base-path',
				base,
			});
			await fixture.build();
		});

		it('Inlined scripts get included without base path in the script', async () => {
			const html = await fetchHTML(fixture, '/hello/scripts/inline');
			const $ = cheerioLoad(html);
			assert.equal($('script').html(), 'console.log("hello world");');
		});
	});
});
