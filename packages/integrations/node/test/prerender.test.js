import nodejs from '../dist/index.js';
import { loadFixture, createRequestAndResponse } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fetch } from 'undici';

describe('Prerendering', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		process.env.ASTRO_NODE_AUTOSTART = 'disabled';
		fixture = await loadFixture({
			base: '/some-base',
			root: './fixtures/prerender/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		const { startServer } = await await load();
		let res = startServer();
		server = res.server;
	});

	after(async () => {
		await server.stop();
	});

	async function load() {
		const mod = await import('./fixtures/prerender/dist/server/entry.mjs');
		return mod;
	}

	it('Can render SSR route', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/some-base/one`);
		const html = await res.text();
		const $ = cheerio.load(html);

		expect(res.status).to.equal(200);
		expect($('h1').text()).to.equal('One');
	});

	it('Can render prerendered route', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/some-base/two`);
		const html = await res.text();
		const $ = cheerio.load(html);

		expect(res.status).to.equal(200);
		expect($('h1').text()).to.equal('Two');
	});

	it('Can render prerendered route with query params', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/some-base/two/?foo=bar`);
		const html = await res.text();
		const $ = cheerio.load(html);

		expect(res.status).to.equal(200);
		expect($('h1').text()).to.equal('Two');
	});

	it('Omitting the trailing slash results in a redirect that includes the base', async () => {
		const res = await fetch(`http://${server.host}:${server.port}/some-base/two`, {
			redirect: 'manual',
		});
		expect(res.status).to.equal(301);
		expect(res.headers.get('location')).to.equal('/some-base/two/');
	});
});
