import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { fetch } from 'undici';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

async function load() {
	const mod = await import(
		`./fixtures/prerender-404/dist/server/entry.mjs?dropcache=${Date.now()}`
	);
	return mod;
}

describe('Prerender 404', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	describe('With base', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				// inconsequential config that differs between tests
				// to bust cache and prevent modules and their state
				// from being reused
				site: 'https://test.dev/',
				base: '/some-base',
				root: './fixtures/prerender-404/',
				output: 'server',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await load();
			let res = startServer();
			server = res.server;
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/static`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(200);
			expect($('h1').text()).to.equal('Hello world!');
		});

		it('Can handle prerendered 404', async () => {
			const res1 = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			const res2 = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			const res3 = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			
			expect(res1.status).to.equal(404);
			expect(res2.status).to.equal(404);
			expect(res3.status).to.equal(404);
			
			const html1 = await res1.text();
			const html2 = await res2.text();
			const html3 = await res3.text();

			expect(html1).to.equal(html2);
			expect(html2).to.equal(html3);
			
			const $ = cheerio.load(html1);

			expect($('body').text()).to.equal('Page does not exist');
		});
	});

	describe('Without base', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				// inconsequential config that differs between tests
				// to bust cache and prevent modules and their state
				// from being reused
				site: 'https://test.info/',
				root: './fixtures/prerender-404/',
				output: 'server',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await load();
			let res = startServer();
			server = res.server;
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/static`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(200);
			expect($('h1').text()).to.equal('Hello world!');
		});

		it('Can handle prerendered 404', async () => {
			const res1 = await fetch(`http://${server.host}:${server.port}/missing`);
			const res2 = await fetch(`http://${server.host}:${server.port}/missing`);
			const res3 = await fetch(`http://${server.host}:${server.port}/missing`);
			
			expect(res1.status).to.equal(404);
			expect(res2.status).to.equal(404);
			expect(res3.status).to.equal(404);
			
			const html1 = await res1.text();
			const html2 = await res2.text();
			const html3 = await res3.text();

			expect(html1).to.equal(html2);
			expect(html2).to.equal(html3);
			
			const $ = cheerio.load(html1);

			expect($('body').text()).to.equal('Page does not exist');
		});
	});
});

describe('Hybrid 404', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	describe('With base', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = false;
			fixture = await loadFixture({
				// inconsequential config that differs between tests
				// to bust cache and prevent modules and their state
				// from being reused
				site: 'https://test.com/',
				base: '/some-base',
				root: './fixtures/prerender-404/',
				output: 'hybrid',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await load();
			let res = startServer();
			server = res.server;
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/some-base/static`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(200);
			expect($('h1').text()).to.equal('Hello world!');
		});

		it('Can handle prerendered 404', async () => {
			const res1 = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			const res2 = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			const res3 = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			
			expect(res1.status).to.equal(404);
			expect(res2.status).to.equal(404);
			expect(res3.status).to.equal(404);
			
			const html1 = await res1.text();
			const html2 = await res2.text();
			const html3 = await res3.text();

			expect(html1).to.equal(html2);
			expect(html2).to.equal(html3);
			
			const $ = cheerio.load(html1);

			expect($('body').text()).to.equal('Page does not exist');
		});
	});

	describe('Without base', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = false;
			fixture = await loadFixture({
				// inconsequential config that differs between tests
				// to bust cache and prevent modules and their state
				// from being reused
				site: 'https://test.net/',
				root: './fixtures/prerender-404/',
				output: 'hybrid',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await load();
			let res = startServer();
			server = res.server;
		});

		after(async () => {
			await server.stop();
			await fixture.clean();
			delete process.env.PRERENDER;
		});

		it('Can render SSR route', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/static`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(200);
			expect($('h1').text()).to.equal('Hello world!');
		});

		it('Can handle prerendered 404', async () => {
			const res1 = await fetch(`http://${server.host}:${server.port}/missing`);
			const res2 = await fetch(`http://${server.host}:${server.port}/missing`);
			const res3 = await fetch(`http://${server.host}:${server.port}/missing`);
			
			expect(res1.status).to.equal(404);
			expect(res2.status).to.equal(404);
			expect(res3.status).to.equal(404);
			
			const html1 = await res1.text();
			const html2 = await res2.text();
			const html3 = await res3.text();

			expect(html1).to.equal(html2);
			expect(html2).to.equal(html3);
			
			const $ = cheerio.load(html1);

			expect($('body').text()).to.equal('Page does not exist');
		});
	});
});
