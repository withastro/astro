import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

async function load() {
	const mod = await import(
		`./fixtures/node-middleware/dist/server/entry.mjs?dropcache=${Date.now()}`
	);
	return mod;
}

describe('behavior from middleware', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let server;

	before(async () => {
		process.env.ASTRO_NODE_AUTOSTART = 'disabled';
		process.env.PRERENDER = false;
		fixture = await loadFixture({
			root: './fixtures/node-middleware/',
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

	describe('404', async () => {
		it('when mode is standalone', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/error-page`);

			expect(res.status).to.equal(404);

			const html = await res.text();
			const $ = cheerio.load(html);

			const body = $('body');
			expect(body.text()).to.equal('Page does not exist');
		});
	});
});
