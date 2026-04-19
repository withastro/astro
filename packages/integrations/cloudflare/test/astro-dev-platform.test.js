import * as assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './_test-utils.js';
import { Logger } from '../../../astro/dist/core/logger/core.js';

describe('AstroDevPlatform', () => {
	let fixture;
	let devServer;
	const logs = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dev-platform/',
		});
		devServer = await fixture.startDevServer({
			vite: { logLevel: 'info' },
			logger: new Logger({
				level: 'info',
				dest: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			}),
		});
		// Do an initial request to prime preloading
		await fixture.fetch('/');
	});

	after(async () => {
		await devServer.stop();
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

	it('adds D1 mocking', async () => {
		const res = await fixture.fetch('/d1');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasDB').text(), 'true');
		assert.equal($('#hasPRODDB').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});

	it('adds R2 mocking', async () => {
		const res = await fixture.fetch('/r2');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasBUCKET').text(), 'true');
		assert.equal($('#hasPRODBUCKET').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});

	it('adds KV mocking', async () => {
		const res = await fixture.fetch('/kv');
		const html = await res.text();
		const $ = cheerio.load(html);
		assert.equal($('#hasKV').text(), 'true');
		assert.equal($('#hasPRODKV').text(), 'true');
		assert.equal($('#hasACCESS').text(), 'true');
	});

	it('Code component works in dev mode (no CommonJS module errors)', async () => {
		const res = await fixture.fetch('/code-test');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		// Verify the page rendered successfully with Code component
		assert.equal($('h1').text(), 'Testing Code Component');
		// Verify the code block was rendered
		assert.ok($('pre').length > 0, 'Code block should be rendered');
	});

	it('should suppress excessive Vite optimization logs in dev mode', async () => {
		const shikiDependenciesOptimizedLog = logs.find(
			(log) =>
				log.message &&
				log.message.includes('new dependencies optimized') &&
				log.message.includes('shiki/langs'),
		);

		assert.ok(!shikiDependenciesOptimizedLog);
	});
});
