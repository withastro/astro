import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

describe('SQL Import', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/sql-import/',
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('can import .sql files', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#query').text().includes('SELECT * FROM users'), true);
		});
	});

	describe('build', () => {
		let previewServer;

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
