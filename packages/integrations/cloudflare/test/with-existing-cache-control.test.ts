import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('existing Cache-Control in _headers', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/with-existing-cache-control/' });
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });
		await fixture.build({ vite: { logLevel: 'info' } });
	});

	after(async () => {
		await fixture.clean();
	});

	it('does not prepend a second Cache-Control block when _headers already has one', async () => {
		const content = await fixture.readFile('client/_headers');
		const matches = content.match(/Cache-Control/g);
		assert.equal(
			matches?.length ?? 0,
			1,
			'should have exactly one Cache-Control directive — the original user one',
		);
	});

	it('preserves the existing user Cache-Control rule', async () => {
		const content = await fixture.readFile('client/_headers');
		assert.match(content, /\/\*/);
		assert.match(content, /Cache-Control: max-age=60/);
	});

	it('does not inject the /_astro/* pattern', async () => {
		const content = await fixture.readFile('client/_headers');
		assert.doesNotMatch(content, /\/_astro\/\*/);
	});
});
