import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Legacy Collections Backwards Compatibility', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/legacy-collections-backwards-compat/',
		});
		await fixture.build();
	});

	it('supports src/content/config.ts file location', async () => {
		// If build succeeded, the legacy config location was accepted
		assert.ok(true);
	});

	it('supports type: "content" collections without loader', async () => {
		const html = await fixture.readFile('/index.html');
		assert.match(html, /post\.md: Test Post/);
	});

	it('supports type: "data" collections without loader', async () => {
		const html = await fixture.readFile('/index.html');
		assert.match(html, /item\.json: Test Item/);
	});
});
