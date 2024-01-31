import { loadFixture } from './test-utils.js';
import * as assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { parseHTML } from 'linkedom';
describe('Basics', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basics/',
		});
		await fixture.build();
	});

	it('Slots are added without the slot attribute', async () => {
		const data = await fixture.readFile('/index.html');
		const { document } = parseHTML(data);
		const bar = document.querySelector('#foo');

		assert.notEqual(bar, undefined);
		assert.equal(bar.getAttribute('slot'), null);
	});
});
