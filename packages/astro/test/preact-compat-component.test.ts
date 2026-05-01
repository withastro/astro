import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Preact compat component', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/preact-compat-component/',
		});
	});

	describe('Development', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Can load Counter', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal($('#counter-text').text(), '0');
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load Counter', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#counter-text').text(), '0');
		});
	});
});
