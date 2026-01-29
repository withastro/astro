import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

/**
 * This test verifies the fix for https://github.com/vitejs/vite/issues/20867
 *
 * When using a linked package (e.g. monorepo workspace package) that imports
 * a dependency, the first dev server request can trigger Vite's dep optimizer
 * mid-request. Without the fix, concurrent client requests would fail with 504
 * because the optimizer's metadata object gets replaced during processing.
 *
 * The fix sets `ignoreOutdatedRequests: true` on the client environment.
 */
describe('Linked package with client:only', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/linked-package-client/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('loads client component from linked package without 504', async () => {
		// First request triggers dep optimization for my-lib and clsx
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200, 'Page should load successfully');

		const html = await res.text();
		const $ = cheerio.load(html);

		// The astro-island should be present (client:only renders a placeholder)
		assert.ok($('astro-island').length > 0, 'Should have astro-island element');

		// Verify the component-url points to our linked package
		const componentUrl = $('astro-island').attr('component-url');
		assert.ok(componentUrl?.includes('my-lib'), 'Component URL should reference my-lib');
	});

	it('renderer script loads without 504', async () => {
		// Request the React client renderer directly
		// This is the request that would fail with 504 before the fix
		const res = await fixture.fetch('/@id/@astrojs/react/client.js');
		assert.equal(res.status, 200, 'React client script should load successfully');

		const content = await res.text();
		assert.ok(content.length > 0, 'Script should have content');
	});
});
