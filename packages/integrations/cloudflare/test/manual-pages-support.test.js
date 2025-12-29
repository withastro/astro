import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './_test-utils.js';

describe('Custom entry file', () => {
	let fixture;
	let previewServer;
	const root = new URL('./fixtures/manual-pages-support/', import.meta.url);

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/manual-pages-support/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('has `_worker.js/index.js` file for SSR', async () => {
		const filePath = fileURLToPath(new URL('dist/_worker.js/index.js', root));
		const hasBuilt = existsSync(filePath);
		assert.equal(hasBuilt, true, `Expected ${filePath} to exist after build`);
	});

	it('has `_routes.json`', async () => {
		const filePath = fileURLToPath(new URL('dist/_routes.json', root));
		const hasBuilt = existsSync(filePath);
		assert.equal(hasBuilt, true, `Expected ${filePath} to exist after build`);
	});

	it('has static assets at root', async () => {
		const filePath = fileURLToPath(new URL('dist/buzz.jpg', root));
		const hasBuilt = existsSync(filePath);
		assert.equal(hasBuilt, true, `Expected ${filePath} to exist after build`);
	});
});
