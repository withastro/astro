import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('HTML Page', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-page/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('works', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const h1 = $('h1');

			assert.equal(h1.text(), 'Hello page!');
		});
	});

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('works', async () => {
			const res = await fixture.fetch('/');

			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			const h1 = $('h1');

			assert.equal(h1.text(), 'Hello page!');
		});
	});
});
