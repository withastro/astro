import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, isWindows, loadFixture } from './test-utils.ts';

const assetsDir = fileURLToPath(
	new URL('./fixtures/content-collections-image-hmr/src/assets/', import.meta.url),
);

describe('HMR: Content Collections image url rename test', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-collections-image-hmr/',
			outDir: './dist/content-collections-image-hmr/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		const renamedPath = path.join(assetsDir, 'shuttle-renamed.jpg');
		const originalPath = path.join(assetsDir, 'shuttle.jpg');
		if (fs.existsSync(renamedPath) && !fs.existsSync(originalPath)) {
			try {
				await fs.promises.rename(renamedPath, originalPath);
			} catch {
				// ignore
			}
		}
		fixture.resetAllFiles();
		await devServer.stop();
	});

	it('should recover after renaming the primary image and updating the markdown reference', {
		skip: isWindows,
	}, async () => {
		await fixture.fetch('/');

		const originalImagePath = path.join(assetsDir, 'shuttle.jpg');
		const renamedImagePath = path.join(assetsDir, 'shuttle-renamed.jpg');

		await fs.promises.rename(originalImagePath, renamedImagePath);
		await fixture.editFile('/src/content/blog/post.md', (content) =>
			content.replace('shuttle.jpg', 'shuttle-renamed.jpg'),
		);
		await fixture.onNextDataStoreChange();

		const response = await fixture.fetch('/');
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.ok(html.includes('data-image="primary"'));
	});
});
