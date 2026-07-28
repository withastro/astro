import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// In Vite dev mode, virtual module IDs starting with \0 are exposed as /@id/__x00__<name>
// Refarence: https://vite.dev/guide/api-plugin#importing-a-virtual-file:~:text=In%20Vite%2C%20since%20%5C0%20is%20not%20a%20permitted%20char%20in%20import%20URLs%2C%20a%20%5C0%7Bid%7D%20virtual%20id%20ends%20up%20encoded%20as%20/%40id/__x00__%7Bid%7D%20during%20dev%20in%20the%20browser.%20The%20id%20is%20decoded%20back%20before%20entering%20the%20plugins%20pipeline%2C%20so%20this%20is%20not%20seen%20by%20plugin%20hooks%20code.
const VIRTUAL_MODULE_ID = '/@id/__x00__virtual:dynamic.css';

describe('Vite Virtual Modules', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let $: cheerio.CheerioAPI;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/vite-virtual-modules/' });
		devServer = await fixture.startDevServer();
		const res = await fixture.fetch('/');
		const html = await res.text();
		$ = cheerio.load(html);
	});

	after(async () => {
		await devServer.stop();
	});

	it('contains style tag with virtual module id', async () => {
		const style = $(`style[data-vite-dev-id="${VIRTUAL_MODULE_ID}"]`);
		assert.equal(style.length, 1);
	});

	it('contains script tag with virtual module id', async () => {
		const script = $(`script[src="${VIRTUAL_MODULE_ID}"]`);
		assert.equal(script.length, 1);
	});
});
