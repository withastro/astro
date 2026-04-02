import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createContainerWithAutomaticRestart,
	startContainer,
} from '../../../dist/core/dev/index.js';

const fixtureDir = fileURLToPath(new URL('../../fixtures/dev-container/', import.meta.url));

/** @type {import('astro').AstroInlineConfig} */
const defaultInlineConfig = {
	logLevel: 'silent',
};

function isStarted(container) {
	return !!container.viteServer.httpServer?.listening;
}

/**
 * Safely clean up a file that a test may have created inside the fixture.
 * No-ops if the file doesn't exist.
 */
function cleanupFile(relPath) {
	try {
		fs.unlinkSync(path.join(fixtureDir, relPath));
	} catch {}
}

// Checking for restarts may hang if no restarts happen, so set a 20s timeout for each test
describe('dev container restarts', { timeout: 20000 }, () => {
	it('Surfaces config errors on restarts', async () => {
		// Ensure clean state
		cleanupFile('astro.config.mjs');

		// Create an empty config so the watcher has something to watch
		fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), '');

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixtureDir,
			},
		});

		try {
			// Create an error in the config
			let restartComplete = restart.restarted();
			fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), 'const foo = bar');
			restart.container.viteServer.watcher.emit(
				'change',
				path.join(fixtureDir, 'astro.config.mjs').replace(/\\/g, '/'),
			);

			// Wait for the restart to finish
			let hmrError = await restartComplete;
			assert.ok(hmrError instanceof Error);

			// Do it a second time to make sure we are still watching
			restartComplete = restart.restarted();
			fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), 'const foo = bar2');
			restart.container.viteServer.watcher.emit(
				'change',
				path.join(fixtureDir, 'astro.config.mjs').replace(/\\/g, '/'),
			);

			hmrError = await restartComplete;
			assert.ok(hmrError instanceof Error);
		} finally {
			await restart.container.close();
			cleanupFile('astro.config.mjs');
		}
	});

	it('Restarts the container if previously started', async () => {
		cleanupFile('astro.config.mjs');
		fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), '');

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixtureDir,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			// Trigger a change
			let restartComplete = restart.restarted();
			fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), '');
			restart.container.viteServer.watcher.emit(
				'change',
				path.join(fixtureDir, 'astro.config.mjs').replace(/\\/g, '/'),
			);
			await restartComplete;

			assert.equal(isStarted(restart.container), true);
		} finally {
			await restart.container.close();
			cleanupFile('astro.config.mjs');
		}
	});

	it('Is able to restart project using astro.config.ts', async () => {
		cleanupFile('astro.config.ts');
		fs.writeFileSync(path.join(fixtureDir, 'astro.config.ts'), '');

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixtureDir,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			// Trigger a change
			let restartComplete = restart.restarted();
			fs.writeFileSync(path.join(fixtureDir, 'astro.config.ts'), '');
			restart.container.viteServer.watcher.emit(
				'change',
				path.join(fixtureDir, 'astro.config.mjs').replace(/\\/g, '/'),
			);
			await restartComplete;

			assert.equal(isStarted(restart.container), true);
		} finally {
			await restart.container.close();
			cleanupFile('astro.config.ts');
		}
	});

	it('Is able to restart project on package.json changes', async () => {
		// Save original package.json to restore later
		const pkgPath = path.join(fixtureDir, 'package.json');
		const originalPkg = fs.readFileSync(pkgPath, 'utf-8');

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixtureDir,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			let restartComplete = restart.restarted();
			// Write a minimal change to package.json
			fs.writeFileSync(pkgPath, originalPkg);
			restart.container.viteServer.watcher.emit('change', pkgPath.replace(/\\/g, '/'));
			await restartComplete;
		} finally {
			await restart.container.close();
			// Restore original
			fs.writeFileSync(pkgPath, originalPkg);
		}
	});

	it('Is able to restart on viteServer.restart API call', async () => {
		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixtureDir,
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
		const settingsPath = path.join(fixtureDir, '.astro', 'settings.json');
		fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
		fs.writeFileSync(settingsPath, '{}');

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: {
				...defaultInlineConfig,
				root: fixtureDir,
			},
		});
		await startContainer(restart.container);
		assert.equal(isStarted(restart.container), true);

		try {
			let restartComplete = restart.restarted();
			fs.writeFileSync(settingsPath, '{ }');
			restart.container.viteServer.watcher.emit('change', settingsPath.replace(/\\/g, '/'));
			await restartComplete;
		} finally {
			await restart.container.close();
		}
	});

	it('Reuses the same viteServer instance on config file change', async () => {
		cleanupFile('astro.config.mjs');
		fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), '');

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: { ...defaultInlineConfig, root: fixtureDir },
		});
		await startContainer(restart.container);

		const originalViteServer = restart.container.viteServer;

		try {
			let restartComplete = restart.restarted();
			fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), '');
			restart.container.viteServer.watcher.emit(
				'change',
				path.join(fixtureDir, 'astro.config.mjs').replace(/\\/g, '/'),
			);
			await restartComplete;

			// The viteServer object should be the same instance — in-place restart
			assert.equal(restart.container.viteServer, originalViteServer);
		} finally {
			await restart.container.close();
			cleanupFile('astro.config.mjs');
		}
	});

	it('Does not accumulate watcher listeners on repeated restarts', async () => {
		cleanupFile('astro.config.mjs');
		fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), '');

		const restart = await createContainerWithAutomaticRestart({
			inlineConfig: { ...defaultInlineConfig, root: fixtureDir },
		});
		await startContainer(restart.container);

		const watcher = restart.container.viteServer.watcher;

		try {
			// Do a first restart to establish the post-restart listener count
			let restartComplete = restart.restarted();
			fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), '// restart 0');
			watcher.emit('change', path.join(fixtureDir, 'astro.config.mjs').replace(/\\/g, '/'));
			await restartComplete;

			const listenerCountAfterFirst = watcher.listenerCount('change');

			// Do two more restarts and verify the count stays stable
			for (let i = 1; i < 3; i++) {
				restartComplete = restart.restarted();
				fs.writeFileSync(path.join(fixtureDir, 'astro.config.mjs'), `// restart ${i}`);
				watcher.emit('change', path.join(fixtureDir, 'astro.config.mjs').replace(/\\/g, '/'));
				await restartComplete;
			}

			// Listener count should be stable — old listeners removed before new ones added
			assert.equal(watcher.listenerCount('change'), listenerCountAfterFirst);
		} finally {
			await restart.container.close();
			cleanupFile('astro.config.mjs');
		}
	});
});
