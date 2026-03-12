import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { loadFixture } from './_test-utils.js';

describe('prerenderEnvironment: node', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender-node-env/', import.meta.url).toString(),
			adapter: cloudflare({
				prerenderEnvironment: 'node',
			}),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
		await fixture.clean();
	});

	it('renders prerendered page using Node.js APIs', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		assert.ok(
			html.includes('id="pkg-name"'),
			'Expected the prerendered page to contain the pkg-name element',
		);
		// The package.json name should be read via node:fs — cwd resolves to
		// the cloudflare package root, so we check for that name
		assert.ok(
			html.includes('@astrojs/cloudflare'),
			'Expected node:fs to successfully read a package.json name',
		);
	});

	it('includes styles in prerendered page', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		assert.ok(
			html.includes('rebeccapurple'),
			'Expected scoped styles to be included in the prerendered page',
		);
	});

	it('renders SSR page through workerd with Astro.request.cf', async () => {
		const res = await fixture.fetch('/ssr');
		assert.equal(res.status, 200);
		const html = await res.text();
		assert.ok(html.includes('id="has-cf"'), 'Expected the SSR page to contain the has-cf element');
		assert.ok(html.includes('>true<'), 'Expected Astro.request.cf to be available in the SSR page');
	});
});
