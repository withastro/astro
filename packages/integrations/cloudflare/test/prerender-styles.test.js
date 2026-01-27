import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { loadFixture } from './_test-utils.js';

describe('Prerendered page styles', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender-styles/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
	});

	after(async () => {
		await devServer?.stop();
		await fixture.clean();
	});

	describe('dev', () => {
		before(async () => {
			devServer = await fixture.startDevServer();
		});

		it('includes Tailwind styles in prerendered page', async () => {
			const res = await fixture.fetch('/');
			const html = await res.text();
			// Check that the bg-amber-500 class has its styles included
			assert.ok(html.includes('.bg-amber-500'), 'Expected .bg-amber-500 class to be in the HTML');
		});
	});

	describe('build', () => {
		before(async () => {
			await devServer?.stop();
			devServer = undefined;
			await fixture.build();
		});

		it('includes Tailwind styles in prerendered page', async () => {
			// With cloudflare adapter, prerendered pages are in dist/client/
			const html = await fixture.readFile('/client/index.html');
			// Check that the bg-amber-500 class has its styles included
			assert.ok(html.includes('.bg-amber-500'), 'Expected .bg-amber-500 class to be in the HTML');
		});
	});
});
