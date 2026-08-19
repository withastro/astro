import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Projects with a space in the folder name', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/space in folder name/app/',
			outDir: './dist/space-in-folder-name/',
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

		it('Work with scripts', async () => {
			const html = await fixture.fetch('/').then((r) => r.text());
			const $ = cheerio.load(html);

			assert.equal($('script[src*="/src/pages/index.astro"]').length, 1);
		});
	});
});
