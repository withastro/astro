// @ts-check

import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from './test-utils.js';

describe('Web Vitals integration basics', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/basics/' });
		devServer = await fixture.startDevServer({});
	});

	after(async () => {
		await devServer.stop();
	});

	it('adds a meta tag to the page', async () => {
		const html = await fixture.fetch('/', {}).then((res) => res.text());
		const { document } = parseHTML(html);
		const meta = document.querySelector('head > meta[name="x-astro-vitals-route"]');
		assert.ok(meta);
		assert.equal(meta.getAttribute('content'), '/');
	});
	
	it('adds a meta tag using the route pattern to the page', async () => {
		const html = await fixture.fetch('/test', {}).then((res) => res.text());
		const { document } = parseHTML(html);
		const meta = document.querySelector('head > meta[name="x-astro-vitals-route"]');
		assert.ok(meta);
		assert.equal(meta.getAttribute('content'), '/[dynamic]');
	});

	it.todo('accepts data to the injected endpoint', async () => {
		const res = await fixture.fetch('/_/astro-vitals', { method: 'POST', body: '[]' });
		assert.equal(res.status, 200);
	})
});
