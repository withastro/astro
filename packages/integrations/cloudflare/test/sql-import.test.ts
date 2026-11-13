import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('SQL Import', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/sql-import/',
		});
	});

	describe('build', () => {
		let previewServer: PreviewServer;
		before(async () => {
			await fixture.build();
			previewServer = await fixture.preview();
		});

		after(async () => {
			await previewServer.stop();
		});

		it('can import .sql files', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#query').text().includes('SELECT * FROM users'), true);
		});
	});
});
