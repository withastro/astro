import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// In Vite dev mode, virtual module IDs starting with \0 are exposed as /@id/__x00__<name>
const VIRTUAL_MODULE_ID = '/@id/__x00__virtual:dynamic.css';

describe('Vite Virtual Modules', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/vite-virtual-modules/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('contains style tag with virtual module id', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);

		const style = $(`style[data-vite-dev-id="${VIRTUAL_MODULE_ID}"]`);
		assert.ok(style.length > 0, `Expected <style data-vite-dev-id="${VIRTUAL_MODULE_ID}"> to exist`);
	});

	it('contains script tag with virtual module id', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		const $ = cheerio.load(html);

		const script = $(`script[src="${VIRTUAL_MODULE_ID}"]`);
		assert.ok(script.length > 0, `Expected <script src="${VIRTUAL_MODULE_ID}"> to exist`);
	});
});
