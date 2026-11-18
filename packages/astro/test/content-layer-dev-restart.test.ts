import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

async function waitFor(condition: () => boolean | Promise<boolean>, timeout = 10000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		if (await condition()) return true;
		await delay(100);
	}
	return false;
}

describe('Content layer dev restart', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-layer-dev-restart/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		delete (globalThis as any).__throwInFlakyLoader;
		fixture.resetAllFiles();
		await devServer.stop();
	});

	it('picks up content entry edits after a config restart', async () => {
		const html = await (await fixture.fetch('/')).text();
		assert.ok(html.includes('Original title'));

		// Vite's in-place restart replaces the server's file watcher
		const initialWatcher = devServer.watcher;
		await fixture.editFile('/astro.config.mjs', (content) =>
			content.replace('defineConfig({})', "defineConfig({ site: 'https://example.com' })"),
		);
		assert.ok(
			await waitFor(() => devServer.watcher !== initialWatcher),
			'Dev server did not restart',
		);

		await fixture.editFile('/src/content/blog/post.md', (content) =>
			content.replace('Original title', 'Updated title'),
		);
		const updated = await waitFor(async () =>
			(await (await fixture.fetch('/')).text()).includes('Updated title'),
		);
		assert.ok(updated, 'Content entry edit was not picked up after restart');
	});

	it('keeps serving when a loader throws after a config restart', async () => {
		const unhandled: unknown[] = [];
		const onUnhandled = (reason: unknown) => unhandled.push(reason);
		process.on('unhandledRejection', onUnhandled);
		(globalThis as any).__throwInFlakyLoader = true;
		const initialWatcher = devServer.watcher;
		await fixture.editFile('/astro.config.mjs', (content) =>
			content.replace("site: 'https://example.com'", "site: 'https://example.org'"),
		);
		assert.ok(
			await waitFor(() => devServer.watcher !== initialWatcher),
			'Dev server did not restart',
		);

		// Syncs are queued, so seeing this edit means the failing sync has settled
		await fixture.editFile('/src/content/blog/post.md', (content) =>
			content.replace('Updated title', 'Final title'),
		);
		const updated = await waitFor(async () =>
			(await (await fixture.fetch('/')).text()).includes('Final title'),
		);
		process.off('unhandledRejection', onUnhandled);
		assert.ok(updated, 'Dev server stopped picking up content edits after a loader error');
		assert.deepEqual(unhandled, []);
	});
});
