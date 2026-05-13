import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('custom build.assets dir', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/custom-assets/' });
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });
		await fixture.build({ vite: { logLevel: 'info' } });
	});

	after(async () => {
		await fixture.clean();
	});

	it('injects Cache-Control for the custom assets dir pattern', async () => {
		const content = await fixture.readFile('client/_headers');
		assert.match(content, /\/_custom\/\*/);
		assert.match(content, /Cache-Control: public, max-age=31536000, immutable/);
	});

	it('does not inject the default /_astro/* pattern when a custom dir is configured', async () => {
		const content = await fixture.readFile('client/_headers');
		assert.doesNotMatch(content, /\/_astro\/\*/);
	});
});
