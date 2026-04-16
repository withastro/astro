import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Astro.redirect output: "static"', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	describe('dev', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;
		before(async () => {
			process.env.STATIC_MODE = true;
			fixture = await loadFixture({
				root: './fixtures/redirects/',
				output: 'static',
				redirects: {
					'/one': '/',
					'/more/old/[dynamic]': '/more/[dynamic]',
					'/more/old/[dynamic]/[route]': '/more/[dynamic]/[route]',
					'/more/old/[...spread]': '/more/new/[...spread]',
				},
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('performs simple redirects', async () => {
			let res = await fixture.fetch('/one', {
				redirect: 'manual',
			});
			assert.equal(res.status, 301);
			assert.equal(res.headers.get('Location'), '/');
		});

		it('performs dynamic redirects', async () => {
			const response = await fixture.fetch('/more/old/hello', { redirect: 'manual' });
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/more/hello');
		});

		it('performs dynamic redirects with special characters', async () => {
			// encodeURI("/more/old/’")
			const response = await fixture.fetch('/more/old/%E2%80%99', { redirect: 'manual' });
			assert.equal(response.status, 301);
			assert.equal(response.headers.get('Location'), '/more/%E2%80%99');
		});

		it('performs dynamic redirects with multiple params', async () => {
			const response = await fixture.fetch('/more/old/hello/world', { redirect: 'manual' });
			assert.equal(response.headers.get('Location'), '/more/hello/world');
		});

		it.skip('falls back to spread rule when dynamic rules should not match', async () => {
			const response = await fixture.fetch('/more/old/welcome/world', { redirect: 'manual' });
			assert.equal(response.headers.get('Location'), '/more/new/welcome/world');
		});
	});
});
