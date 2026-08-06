import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture, waitServerListen, type AdapterServer } from './test-utils.ts';

describe('build.format: file', () => {
	let fixture: Fixture;
	let server: AdapterServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender/',
			output: 'server',
			outDir: './dist/build-format-file',
			build: { format: 'file' },
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
		await fixture.clean();
	});

	it('Can render SSR route', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/one`);
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal(res.status, 200);
		assert.equal($('h1').text(), 'One');
	});

	it('Can render prerendered route with clean URL', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/two`);
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal(res.status, 200);
		assert.equal($('h1').text(), 'Two');
	});

	it('Can render prerendered route with explicit .html extension', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/two.html`);
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal(res.status, 200);
		assert.equal($('h1').text(), 'Two');
	});

	it('Outputs pages as .html files, not directories', async () => {
		assert.ok(fixture.pathExists('/client/two.html'));
	});
});

describe('build.format: preserve', () => {
	let fixture: Fixture;
	let server: AdapterServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender/',
			output: 'server',
			outDir: './dist/build-format-preserve',
			build: { format: 'preserve' },
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		const { startServer } = await fixture.loadAdapterEntryModule();
		const res = startServer();
		server = res.server;
		await waitServerListen(server.server);
	});

	after(async () => {
		await server.stop();
		await fixture.clean();
	});

	it('Can render SSR route', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/one`);
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal(res.status, 200);
		assert.equal($('h1').text(), 'One');
	});

	it('Can render prerendered route with clean URL', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/two`);
		const html = await res.text();
		const $ = cheerio.load(html);

		assert.equal(res.status, 200);
		assert.equal($('h1').text(), 'Two');
	});
});
