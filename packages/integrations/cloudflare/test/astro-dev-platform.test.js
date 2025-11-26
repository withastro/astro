import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';

describe('AstroDevPlatform', () => {
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dev-platform/',
			logLevel: 'debug',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('exists', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasRuntime').text().includes('true'), true);
	});

	it('adds cf object', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasCF').text(), 'true');
	});

	it('adds cache mocking', async () => {
		const res = await fixture.fetch('/caches');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasCACHE').text(), 'true');
	});

	it('adds D1 mocking', {skip: "mocking currently broken", todo: "must restore D1 mocking"},async () => {
		const res = await fixture.fetch('/d1');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasDB').text(), 'true');
		assert.equal($('#hasPRODDB').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});

	it('adds R2 mocking', {skip: "mocking currently broken", todo: "must restore R2 mocking"},async () => {
		const res = await fixture.fetch('/r2');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasBUCKET').text(), 'true');
		assert.equal($('#hasPRODBUCKET').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});

	it('adds KV mocking', {skip: "mocking currently broken", todo: "must restore kv mocking"}, async () => {
		const res = await fixture.fetch('/kv');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasKV').text(), 'true');
		assert.equal($('#hasPRODKV').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});
});
