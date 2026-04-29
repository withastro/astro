import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('Vue', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/with-vue/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('renders the vue component', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('.vue').text(), 'Vue Content');
	});
});
