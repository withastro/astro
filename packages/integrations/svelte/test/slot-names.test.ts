import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('Slot names', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/slot-names/', import.meta.url),
		});
		await fixture.build();
	});

	it('escapes slot names in the rendered slot wrapper', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		assert.equal($('#injected').length, 0);
		assert.equal($('#content').length, 1);
		assert.equal($('#hydrated-content').length, 1);
		for (const el of $('astro-static-slot[name], astro-slot[name]').toArray()) {
			assert.equal($(el).attr('name'), 'tab"><b id="injected">x</b><i title="');
		}
	});
});
