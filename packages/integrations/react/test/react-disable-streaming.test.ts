import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('React experimentalDisableStreaming', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/react-disable-streaming/', import.meta.url),
		});
		await fixture.build();
	});

	it('generates a unique React.useId per component', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const ids = $('.react-use-id')
			.map((_, el) => $(el).attr('id'))
			.get();
		assert.equal(ids.length, 4);
		assert.equal(new Set(ids).size, 4);
	});

	it('uses the island prefix in React.useId', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const islands = $('astro-island');
		assert.equal(islands.length, 2);
		islands.each((_, island) => {
			const prefix = $(island).attr('prefix');
			assert.ok(prefix);
			assert.ok($(island).find('.react-use-id').attr('id')?.includes(prefix));
		});
	});
});
