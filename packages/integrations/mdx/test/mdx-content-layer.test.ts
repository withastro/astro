import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('Content Layer MDX rendering build', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/content-layer/', import.meta.url),
		});
		await fixture.build();
	});

	it('Render an MDX file', async () => {
		const html = await fixture.readFile('/reptiles/iguana/index.html');

		assert.match(html, /Iguana/);
		assert.match(html, /This is a rendered entry/);
	});
});
