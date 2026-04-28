import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Custom Renderer - SSR', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-renderer/',
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

		it('renders /', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Client Directives');
		});

		it('renders SSR custom renderer functional components as expected', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			assert.equal($('p').length, 5);
		});
	});
});
