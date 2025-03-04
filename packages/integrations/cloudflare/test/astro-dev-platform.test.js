import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { astroCli } from './_test-utils.js';

const root = new URL('./fixtures/astro-dev-platform/', import.meta.url);
describe('AstroDevPlatform', () => {
	let cli;
	before(async () => {
		cli = astroCli(fileURLToPath(root), 'dev', '--host', '127.0.0.1');
		await new Promise((resolve) => {
			cli.stdout.on('data', (data) => {
				if (data.includes('http://127.0.0.1:4321/')) {
					resolve();
				}
			});
		});
	});

	after((_done) => {
		cli.kill();
	});

	it('exists', async () => {
		const res = await fetch('http://127.0.0.1:4321/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasRuntime').text().includes('true'), true);
	});

	it('adds cf object', async () => {
		const res = await fetch('http://127.0.0.1:4321/');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasCF').text(), 'true');
	});

	it('adds cache mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/caches');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasCACHE').text(), 'true');
	});

	it('adds D1 mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/d1');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasDB').text(), 'true');
		assert.equal($('#hasPRODDB').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});

	it('adds R2 mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/r2');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasBUCKET').text(), 'true');
		assert.equal($('#hasPRODBUCKET').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});

	it('adds KV mocking', async () => {
		const res = await fetch('http://127.0.0.1:4321/kv');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasKV').text(), 'true');
		assert.equal($('#hasPRODKV').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});
});
