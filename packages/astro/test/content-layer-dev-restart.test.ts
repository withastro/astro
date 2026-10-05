import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { type DevServer, type Fixture, isWindows, loadFixture } from './test-utils.ts';

const UPDATED_CONTENT = '---\ntitle: Content layer dev restart\n---\n\nUpdated content\n';

async function waitFor(condition: () => boolean, timeout = 10000) {
	const start = Date.now();
	while (!condition()) {
		if (Date.now() - start > timeout) {
			throw new Error('Condition not met within timeout');
		}
		await delay(50);
	}
}

describe('Content layer: dev server restart', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-layer-dev-restart/',
			outDir: './dist/content-layer-dev-restart/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
		fixture.resetAllFiles();
	});

	it('picks up content changes after a config-triggered restart', {
		skip: isWindows ? 'HMR tests hang on Windows' : false,
	}, async () => {
		let html = await (await fixture.fetch('/')).text();
		assert.ok(html.includes('Original content'));

		const watcherBeforeRestart = devServer.watcher;
		await fixture.editFile('/astro.config.mjs', (contents) => `${contents}\n// restart\n`);
		await waitFor(() => devServer.watcher !== watcherBeforeRestart);

		await fixture.editFile('/src/content/blog/post.md', UPDATED_CONTENT);
		await fixture.onNextDataStoreChange();

		html = await (await fixture.fetch('/')).text();
		assert.ok(html.includes('Updated content'));
	});
});
