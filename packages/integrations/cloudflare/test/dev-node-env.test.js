import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { loadFixture } from './_test-utils.js';

describe('devEnvironment: node', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/dev-node-env/', import.meta.url).toString(),
			adapter: cloudflare({
				devEnvironment: 'node',
			}),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
		await fixture.clean();
	});

	it('renders SSR page with Node.js APIs in dev', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();

		assert.ok(html.includes('id="pkg-name"'));
		assert.ok(
			html.includes('@astrojs/cloudflare'),
			'Expected node:fs to successfully read package.json in dev SSR',
		);
	});

	it('does not expose Astro.request.cf in Node dev SSR', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		assert.ok(html.includes('id="has-cf"'));
		assert.ok(html.includes('>false<'));
	});
});
