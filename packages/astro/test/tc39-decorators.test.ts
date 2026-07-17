import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('TC39 decorators', () => {
	describe('build', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/tc39-decorators/',
			});
			await fixture.build();
		});

		it('lowers TC39 decorators and renders correctly', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#greeting').text(), 'Hello, Astro!');
		});
	});

	describe('dev', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/tc39-decorators/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('lowers TC39 decorators and renders correctly', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#greeting').text(), 'Hello, Astro!');
		});
	});
});
