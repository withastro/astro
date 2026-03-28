import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import cloudflare from '../../integrations/cloudflare/dist/index.js';
import { loadFixture } from '../../astro/test/test-utils.js';
import { setupRemoteDb } from './test-utils.js';

describe('astro:db build --remote with Cloudflare adapter', () => {
	/** @type {import('../../astro/test/test-utils.js').Fixture} */
	let fixture;
	let remoteDbServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/static-remote/', import.meta.url),
			adapter: cloudflare(),
		});
		remoteDbServer = await setupRemoteDb(fixture.config);
		await fixture.build();
	});

	after(async () => {
		await remoteDbServer?.stop();
		await fixture.clean();
	});

	it('builds and prerenders Astro DB pages', async () => {
		const html = await fixture.readFile('/client/index.html');
		const $ = cheerioLoad(html);

		assert.equal($('li').length, 1);
	});
});
