import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, isWindows, loadFixture } from './test-utils.ts';

const UPDATED_CONTENT = '---\ntitle: HMR Markdown\n---\n\nUpdated content\n';

describe('HMR: Markdown updates', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let markdownPath: string;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/hmr-markdown/' });
		devServer = await fixture.startDevServer();

		markdownPath = '/src/content/blog/post.md';
	});

	after(async () => {
		await devServer.stop();
	});

	it('should update HTML when markdown changes', {
		skip: isWindows,
		todo: 'HMR tests hang on Windows',
	}, async () => {
		let response = await fixture.fetch('/');
		assert.equal(response.status, 200);
		let html = await response.text();
		assert.ok(html.includes('Original content'));

		response = await fixture.fetch('/blog/post');
		assert.equal(response.status, 200);
		html = await response.text();
		assert.ok(html.includes('Original content'));

		await fixture.editFile(markdownPath, () => UPDATED_CONTENT);
		await fixture.onNextDataStoreChange();

		response = await fixture.fetch('/');
		assert.equal(response.status, 200);
		html = await response.text();
		assert.ok(html.includes('Updated content'));

		response = await fixture.fetch('/blog/post');
		assert.equal(response.status, 200);
		html = await response.text();
		assert.ok(html.includes('Updated content'));
	});
});
