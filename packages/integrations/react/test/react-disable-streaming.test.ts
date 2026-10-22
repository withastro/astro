import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('React with experimentalDisableStreaming', () => {
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
			.map((_i, el) => $(el).attr('id'))
			.get();

		assert.equal(ids.length, 4);
		assert.equal(new Set(ids).size, 4);
	});

	it('uses the island prefix that the client hydrates with', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const islands = $('astro-island');

		assert.equal(islands.length, 2);
		islands.each((_i, island) => {
			const prefix = $(island).attr('prefix');
			const id = $(island).find('.react-use-id').attr('id');
			assert.ok(prefix && id?.includes(prefix), `id ${id} should include prefix ${prefix}`);
		});
	});
});
