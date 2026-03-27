import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

describe('AstroDevPlatform', () => {
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

	it('loads var from wrangler.jsonc', async () => {
		const res = await fixture.fetch('/');
		const content = await res.text();
		assert.match(content, /^<!DOCTYPE html>BAH.*/);
	});
});
