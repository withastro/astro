import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

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
			const res = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(404);
			expect($('body').text()).to.equal('Page does not exist');
		});
	});

	describe('Without base', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				root: './fixtures/prerender-404/',
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
			const res = await fetch(`http://${server.host}:${server.port}/missing`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(404);
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
				base: '/some-base',
				root: './fixtures/prerender-404/',
				output: 'hybrid',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await await load();
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
			const res = await fetch(`http://${server.host}:${server.port}/some-base/missing`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(404);
			expect($('body').text()).to.equal('Page does not exist');
		});
	});

	describe('Without base', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = false;
			fixture = await loadFixture({
				root: './fixtures/prerender-404/',
				output: 'hybrid',
				adapter: nodejs({ mode: 'standalone' }),
			});
			await fixture.build();
			const { startServer } = await await load();
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
			const res = await fetch(`http://${server.host}:${server.port}/missing`);
			const html = await res.text();
			const $ = cheerio.load(html);

			expect(res.status).to.equal(404);
			expect($('body').text()).to.equal('Page does not exist');
		});
	});
});
