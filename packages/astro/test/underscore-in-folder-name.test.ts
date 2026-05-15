import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Projects with an underscore in the folder name', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/_underscore in folder name/',
			output: 'static',
			adapter: testAdapter(),
			outDir: './dist/underscore-in-folder-name/',
		});
		await fixture.build();
	});

	it('includes page from node_modules/fake-astro-library', async () => {
		const app = await fixture.loadTestAdapterApp();
		const assets: Set<string> = app.manifest.assets;
		assert.equal(assets.has('/index.html'), true);
		assert.equal(assets.has('/404.html'), true);
	});
});
