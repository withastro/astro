import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { isWindows, loadFixture } from './test-utils.js';

const UPDATED_CONTENT = '---\ntitle: HMR Markdown\n---\n\nUpdated content\n';

describe('HMR: Markdown updates via import.meta.glob', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;
	/** @type {string} */
	let markdownPath;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/hmr-markdown-glob/' });
		devServer = await fixture.startDevServer();

		markdownPath = '/src/posts/post.md';
	});

	after(async () => {
		await devServer.stop();
	});

	it(
		'should update HTML when markdown changes using import.meta.glob in getStaticPaths',
		{ skip: isWindows, todo: 'HMR tests hang on Windows' },
		async () => {
			let response = await fixture.fetch('/blog/post');
			assert.equal(response.status, 200);
			let html = await response.text();
			assert.ok(html.includes('Original content'));

			await fixture.editFile(markdownPath, UPDATED_CONTENT);
			// Wait a moment for HMR to propagate (no data store involved since
			// this fixture does not use content collections)
			await new Promise((resolve) => setTimeout(resolve, 500));

			response = await fixture.fetch('/blog/post');
			assert.equal(response.status, 200);
			html = await response.text();
			assert.ok(html.includes('Updated content'));
		},
	);
});
