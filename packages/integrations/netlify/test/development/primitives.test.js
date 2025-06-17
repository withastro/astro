import assert from 'node:assert/strict';
import { after, afterEach,before, describe, it } from 'node:test';

import * as cheerio from 'cheerio';

import netlifyAdapter from "../../dist/index.js"
import { loadFixture } from '../../../../astro/test/test-utils.js';

describe('Netlify primitives', () => {
	describe('Development', () => {
		/** @type {import('../../../../astro/test/test-utils').Fixture} */
		let fixture;
		let devServer;
		before(async () => {
			fixture = await loadFixture({
				root: '../../integrations/netlify/test/development/fixtures/primitives/',
				output: 'server',
				adapter: netlifyAdapter()
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		afterEach(async () => {
			fixture.resetAllFiles()
		});

		it('loads Astro routes', async () => {
			const rootResponse = await fixture.fetch('/');
			const $root = cheerio.load(await rootResponse.text());

			assert.equal($root('h1').text(), 'Middleware');

			const imgResponse = await fixture.fetch('/astronaut');
			const $img = cheerio.load(await imgResponse.text());

			assert($img('img').attr('src').startsWith('/_image?href='));
		})

		it('loads function routes', async () => {
			const firstResponse = await fixture.fetch('/function');
			
			assert.equal(await firstResponse.text(), 'Hello from function');

			await fixture.editFile('netlify/functions/func.mjs', (content) => content.replace('Hello', 'Hello again'));

			const secondResponse = await fixture.fetch('/function');
			
			assert.equal(await secondResponse.text(), 'Hello again from function');
		});

		it('loads edge function routes', async () => {
			const efResponse = await fixture.fetch('/processed/hello');
			const $root = cheerio.load(await efResponse.text());

			assert.equal($root('h1').text(), 'HELLO THERE, ASTRONAUT.');
		});
	});
});