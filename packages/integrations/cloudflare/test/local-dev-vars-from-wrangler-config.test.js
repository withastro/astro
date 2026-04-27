import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';
import cloudflare from '../dist/index.js';

describe('Astro Cloudflare local dev vars from wrangler.json/c', () => {
	let fixture;
	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/wrangler-config-vars-dev/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
		devServer = await fixture.startDevServer();
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
			root: new URL('./fixtures/wrangler-config-vars-dev/', import.meta.url).toString(),
			adapter: cloudflare(),
		});
		process.env.CLOUDFLARE_ENV = 'testenv';
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		delete process.env.CLOUDFLARE_ENV;
		await devServer.stop();
	});

	it('loads var from an environment in wrangler.jsonc', async () => {
		const res = await fixture.fetch('/test');
		const content = await res.text();
		assert.match(content, /^<!doctype html>BAR/);
	});
});
