import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { getSharedFixture } from './shared-fixture.js';

/**
 * Consolidated test suite for SSR tests
 * This consolidates multiple smaller SSR test files to reduce total test execution time
 */

const base = '/hello';

async function fetchHTML(fixture, path) {
	const app = await fixture.loadTestAdapterApp();
	const request = new Request('http://example.com' + path);
	const response = await app.render(request);
	const html = await response.text();
	return html;
}

describe('SSR Tests', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await getSharedFixture({
			root: './fixtures/ssr/',
			output: 'server',
			adapter: testAdapter(),
			base,
		});
		await fixture.build();
	});

	describe('Scripts in SSR', () => {
		it('inline scripts get included', async () => {
			const html = await fetchHTML(fixture, base + '/scripts/inline');
			const $ = cheerioLoad(html);
			assert.equal($('script').length, 1);
		});

		it('inline scripts get included without base path in the script content', async () => {
			const html = await fetchHTML(fixture, base + '/scripts/inline');
			const $ = cheerioLoad(html);
			assert.equal($('script').html(), 'console.log("hello world");');
		});

		// Note: External script tests (testing inline scripts with assetsInlineLimit: 0)
		// cannot be included here because shared fixtures don't support different build configs
	});

	// Additional SSR tests can be added here as we consolidate more files
});
