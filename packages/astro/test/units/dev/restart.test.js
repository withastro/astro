import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';

import {
	createContainerWithAutomaticRestart,
	startContainer,
} from '../../../dist/core/dev/index.js';
import { createFixture, createRequestAndResponse } from '../test-utils.js';

/** @type {import('astro').AstroInlineConfig} */
const defaultInlineConfig = {
	logLevel: 'silent',
};

function isStarted(container) {
	return !!container.viteServer.httpServer?.listening;
}

// Checking for restarts may hang if no restarts happen, so set a 20s timeout for each test
describe('dev container restarts', { timeout: 20000 }, () => {
	it('Surfaces config errors on restarts', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': `
				<html>
					<head><title>Test</title></head>
					<body>
						<h1>Test</h1>
					</body>
				</html>
			`,
			'/astro.config.mjs': ``,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixture.path,
			},
		});

		try {
			let r = createRequestAndResponse({
				method: 'GET',
				url: '/',
			});
			restart.container.handle(r.req, r.res);
			let html = await r.text();
			const $ = cheerio.load(html);
			assert.equal(r.res.statusCode, 200);
			assert.equal($('h1').length, 1);

			// Create an error
			let restartComplete = restart.restarted();
			await fixture.writeFile('/astro.config.mjs', 'const foo = bar');
			// TODO: fix this hack
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'),
			);

			// Wait for the restart to finish
			let hmrError = await restartComplete;
			assert.ok(hmrError instanceof Error);

			// Do it a second time to make sure we are still watching

			restartComplete = restart.restarted();
			await fixture.writeFile('/astro.config.mjs', 'const foo = bar2');
			// TODO: fix this hack
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'),
			);

			hmrError = await restartComplete;
			assert.ok(hmrError instanceof Error);
		} finally {
			await restart.container.close();
		}
	});

	it('Restarts the container if previously started', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': `
				<html>
					<head><title>Test</title></head>
					<body>
						<h1>Test</h1>
					</body>
				</html>
			`,
			'/astro.config.mjs': ``,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixture.path,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			// Trigger a change
			let restartComplete = restart.restarted();
			await fixture.writeFile('/astro.config.mjs', '');
			// TODO: fix this hack
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'),
			);
			await restartComplete;

			assert.equal(isStarted(restart.container), true);
		} finally {
			await restart.container.close();
		}
	});

	it('Is able to restart project using Tailwind + astro.config.ts', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': ``,
			'/astro.config.ts': ``,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixture.path,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			// Trigger a change
			let restartComplete = restart.restarted();
			await fixture.writeFile('/astro.config.ts', '');
			// TODO: fix this hack
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'),
			);
			await restartComplete;

			assert.equal(isStarted(restart.container), true);
		} finally {
			await restart.container.close();
		}
	});

	it('Is able to restart project on package.json changes', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': ``,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixture.path,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			let restartComplete = restart.restarted();
			await fixture.writeFile('/package.json', `{}`);
			// TODO: fix this hack
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/package.json').replace(/\\/g, '/'),
			);
			await restartComplete;
		} finally {
			await restart.container.close();
		}
	});

	it('Is able to restart on viteServer.restart API call', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': ``,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixture.path,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			// viteServer.restart() is now handled natively by Vite — just verify
			// it completes without error and the server is still running.
			await restart.container.viteServer.restart();
			assert.equal(isStarted(restart.container), true);
		} finally {
			await restart.container.close();
		}
	});

	it('Is able to restart project on .astro/settings.json changes', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': ``,
			'/.astro/settings.json': `{}`,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixture.path,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			let restartComplete = restart.restarted();
			await fixture.writeFile('/.astro/settings.json', `{ }`);
			// TODO: fix this hack
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/.astro/settings.json').replace(/\\/g, '/'),
			);
			await restartComplete;
		} finally {
			await restart.container.close();
		}
	});

	it('Reuses the same viteServer instance on config file change', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': ``,
			'/astro.config.mjs': ``,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: { ...defaultInlineConfig, root: fixture.path },
		});
		await startContainer(restart.container);

		const originalViteServer = restart.container.viteServer;

		try {
			let restartComplete = restart.restarted();
			await fixture.writeFile('/astro.config.mjs', ``);
			restart.container.viteServer.watcher.emit(
				'change',
				fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'),
			);
			await restartComplete;

			// The viteServer object should be the same instance — in-place restart
			assert.equal(restart.container.viteServer, originalViteServer);
		} finally {
			await restart.container.close();
		}
	});

	it('Does not accumulate watcher listeners on repeated restarts', async () => {
		const fixture = await createFixture({
			'/src/pages/index.astro': ``,
			'/astro.config.mjs': ``,
		});

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: { ...defaultInlineConfig, root: fixture.path },
		});
		await startContainer(restart.container);

		const watcher = restart.container.viteServer.watcher;

		try {
			// Do a first restart to establish the post-restart listener count
			let restartComplete = restart.restarted();
			await fixture.writeFile('/astro.config.mjs', `// restart 0`);
			watcher.emit('change', fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'));
			await restartComplete;

			const listenerCountAfterFirst = watcher.listenerCount('change');

			// Do two more restarts and verify the count stays stable
			for (let i = 1; i < 3; i++) {
				restartComplete = restart.restarted();
				await fixture.writeFile('/astro.config.mjs', `// restart ${i}`);
				watcher.emit('change', fixture.getPath('/astro.config.mjs').replace(/\\/g, '/'));
				await restartComplete;
			}

			// Listener count should be stable — old listeners removed before new ones added
			assert.equal(watcher.listenerCount('change'), listenerCountAfterFirst);
		} finally {
			await restart.container.close();
		}
	});
});
