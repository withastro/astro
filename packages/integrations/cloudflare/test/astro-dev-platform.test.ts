import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';
import { Writable } from 'node:stream';
import { AstroLogger, type AstroLoggerMessage } from '../../../astro/dist/core/logger/core.js';

describe('AstroDevPlatform', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	const logs: AstroLoggerMessage[] = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dev-platform/',
		});
		devServer = await fixture.startDevServer({
			vite: { logLevel: 'info' },
			// @ts-expect-error: `logger` is an internal API
			logger: new AstroLogger({
				level: 'info',
				destination: new Writable({
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

	it('Prism component works in dev mode (no CommonJS module errors)', async () => {
		const res = await fixture.fetch('/prism-test');
		assert.equal(res.status, 200);
		const html = await res.text();
		const $ = cheerio.load(html);
		// Verify the page rendered successfully with Prism component
		assert.equal($('h1').text(), 'Testing Prism Component');
		// Verify the code block was rendered
		// 'css', 'js', 'ts', and 'rust'
		assert.equal($('pre').length, 4, 'Code block should be rendered');
	});

	it('Prism component loads languages correctly in dev mode', async () => {
		const prismUnableToLoadLog = logs.find((log) =>
			log.message.includes('Unable to load the language'),
		);

		assert.ok(
			!prismUnableToLoadLog,
			`Should not see "Unable to load the language" message, but got: ${prismUnableToLoadLog?.message}`,
		);
	});
});
