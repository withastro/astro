import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { type DevServer, type Fixture, isWindows, loadFixture } from './test-utils.ts';

const POST_PATH = '/src/content/blog/post.md';

async function waitFor(condition: () => boolean, timeout = 10000) {
	const start = Date.now();
	while (!condition()) {
		if (Date.now() - start > timeout) {
			throw new Error('Condition not met within timeout');
		}
		await delay(50);
	}
}

describe('HMR: Content layer after dev server restart', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	async function restartAndExpectContentUpdate(triggerRestart: () => Promise<void>, body: string) {
		const watcherBeforeRestart = devServer.watcher;
		await triggerRestart();
		// Vite swaps in the new watcher only after the content layer has re-synced on it.
		await waitFor(() => devServer.watcher !== watcherBeforeRestart);

		await fixture.editFile(POST_PATH, `---\ntitle: Content layer dev restart\n---\n\n${body}\n`);
		await fixture.onNextDataStoreChange();

		const html = await (await fixture.fetch('/')).text();
		assert.ok(html.includes(body));
	}

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
		skip: isWindows,
	}, async () => {
		const html = await (await fixture.fetch('/')).text();
		assert.ok(html.includes('Original content'));

		await restartAndExpectContentUpdate(async () => {
			await fixture.editFile('/astro.config.mjs', (contents) => `${contents}\n// restart\n`);
		}, 'Updated after config restart');
	});

	it('picks up content changes after a restart triggered by a Vite plugin', {
		skip: isWindows,
	}, async () => {
		const actionsFile = new URL('./src/actions/index.ts', fixture.config.root);
		try {
			// The actions plugin calls `server.restart()` directly when an actions file appears.
			await restartAndExpectContentUpdate(async () => {
				fs.mkdirSync(new URL('./', actionsFile), { recursive: true });
				fs.writeFileSync(actionsFile, 'export const server = {};\n');
			}, 'Updated after plugin restart');
		} finally {
			fs.rmSync(new URL('./', actionsFile), { recursive: true, force: true });
		}
	});
});
