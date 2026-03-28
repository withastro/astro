import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

describe('Astro Cloudflare local dev vars from wrangler.json/c', () => {
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/wrangler-config-vars-dev/',
		});
		devServer = await fixture.startDevServer();
		// Do an initial request to prime preloading
		await fixture.fetch('/');
	});

	after(async () => {
		await devServer.stop();
	});

	it('loads var from the root of wrangler.jsonc', async () => {
		const res = await fixture.fetch('/test');
		const content = await res.text();
		assert.match(content, /^<!doctype html>FOO/);
	});
});

describe('Astro Cloudflare environment-specific local dev vars from wrangler.json/c', () => {
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/wrangler-config-vars-dev/',
		});
		devServer = await fixture.startDevServer(null, { CLOUDFLARE_ENV: 'testenv' });
		// Do an initial request to prime preloading
		await fixture.fetch('/');
	});

	after(async () => {
		await devServer.stop();
	});

	it('loads var from an environment in wrangler.jsonc', async () => {
		const res = await fixture.fetch('/test');
		const content = await res.text();
		assert.match(content, /^<!doctype html>BAR/);
	});
});
