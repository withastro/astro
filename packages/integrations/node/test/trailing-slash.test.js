import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
/**
 * @typedef {import('astro/test/test-utils.js').Fixture} Fixture
 */

async function load() {
	const mod = await import(
		`./fixtures/trailing-slash/dist/server/entry.mjs?dropcache=${Date.now()}`
	);
	return mod;
}

describe('Trailing Slash In Production', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	let server;

	describe('By default does add the trailing slash', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				// inconsequential config that differs between tests
				// to bust cache and prevent modules and their state
				// from being reused
				output: 'hybrid',
				root: './fixtures/trailing-slash/',
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

		it('redirects each route to have trailing slash', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/one`);
			expect(res.url).to.contain('one/');
			expect(res.status).to.equal(301);
		});
	});

	describe('Does not add trailing slash when set to never', async () => {
		before(async () => {
			process.env.ASTRO_NODE_AUTOSTART = 'disabled';
			process.env.PRERENDER = true;

			fixture = await loadFixture({
				// inconsequential config that differs between tests
				// to bust cache and prevent modules and their state
				// from being reused
				output: 'hybrid',
				trailingSlash: 'never',
				root: './fixtures/trailing-slash/',
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

		it('redirects each route to have trailing slash', async () => {
			const res = await fetch(`http://${server.host}:${server.port}/one`);
			expect(res.url).to.not.contain('one/');
		});
	});
});
