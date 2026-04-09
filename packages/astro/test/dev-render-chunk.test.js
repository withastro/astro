import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('core/render chunk', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-render/',
			logLevel: 'silent',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('does not throw on user object with type', async () => {
		const res = await fixture.fetch('/chunk');
		const html = await res.text();
		const $ = cheerio.load(html);
		const target = $('#chunk');

		assert.ok(target);
		assert.equal(target.text(), '[object Object]');
	});
});
