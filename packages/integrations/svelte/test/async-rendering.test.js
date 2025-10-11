import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';

let fixture;

describe('Async rendering', () => {
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/async-rendering/', import.meta.url),
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can render async components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerioLoad(html);

			assert.ok($('.weather').text().startsWith('The current temperature at KSC is'));
		});
	});

	describe('dev', () => {
		/** @type {import('../../../astro/test/test-utils.js').Fixture} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Can render async components', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerioLoad(html);

			assert.ok($('.weather').text().startsWith('The current temperature at KSC is'));
		});
	});
});
