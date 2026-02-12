import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { isWindows, loadFixture } from './test-utils.js';

const NEW_PAGE_CONTENT = `---
---
<html>
  <head><title>New Page</title></head>
  <body><h1>New Page Created via HMR</h1></body>
</html>
`;

describe('HMR: New page detection', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;
	/** @type {string} */
	let newPagePath;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/hmr-new-page/' });
		devServer = await fixture.startDevServer();

		// Compute path for the new page we'll create during tests
		const fixtureRoot = fileURLToPath(new URL('./fixtures/hmr-new-page/', import.meta.url));
		newPagePath = path.join(fixtureRoot, 'src/pages/new-page.astro');
	});

	after(async () => {
		await devServer.stop();
		// Clean up: remove the new page if it exists
		try {
			await fs.promises.unlink(newPagePath);
		} catch {
			// File doesn't exist, that's fine
		}
	});

	it('should return 200 for index page', async () => {
		const response = await fixture.fetch('/');
		assert.equal(response.status, 200);
	});

	it('should return 404 for non-existent page', async () => {
		const response = await fixture.fetch('/new-page');
		assert.equal(response.status, 404);
	});

	it(
		'should detect a new page without server restart',
		{ skip: isWindows, todo: 'I hangs on windows' },
		async () => {
			// 1. Verify the page doesn't exist yet
			let response = await fixture.fetch('/new-page');
			assert.equal(response.status, 404, 'Page should not exist initially');

			// 2. Create the new page file
			await fs.promises.writeFile(newPagePath, NEW_PAGE_CONTENT, 'utf-8');

			// 3. Wait for HMR to process the change
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// 4. Verify the new page is now accessible
			response = await fixture.fetch('/new-page');
			assert.equal(response.status, 200, 'Page should be accessible after creation');

			const html = await response.text();
			assert.ok(html.includes('New Page Created via HMR'), 'Page content should match');
		},
	);

	it(
		'should detect page removal without server restart',
		{ skip: isWindows, todo: 'I hangs on windows' },
		async () => {
			// Ensure the page exists first (from previous test or create it)
			if (!fs.existsSync(newPagePath)) {
				await fs.promises.writeFile(newPagePath, NEW_PAGE_CONTENT, 'utf-8');
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}

			// 1. Verify the page is accessible
			let response = await fixture.fetch('/new-page');
			assert.equal(response.status, 200, 'Page should exist before deletion');

			// 2. Delete the page file
			await fs.promises.unlink(newPagePath);

			// 3. Wait for HMR to process the change
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// 4. Verify the page now returns 404
			response = await fixture.fetch('/new-page');
			assert.equal(response.status, 404, 'Page should return 404 after deletion');
		},
	);
});
