import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// getStaticPaths() results were cached indefinitely during `astro dev`,
// so external data changes (e.g. headless CMS) were never reflected without restarting the dev server.
describe('dev: route cache is cleared between requests', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/hmr-route-cache/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('re-runs getStaticPaths() on each request', async () => {
		const res1 = await fixture.fetch('/test');
		assert.equal(res1.status, 200);
		const time1 = Number.parseInt(
			cheerio
				.load(await res1.text())('#time')
				.text(),
		);
		await new Promise((r) => setTimeout(r, 10));
		const res2 = await fixture.fetch('/test');
		assert.equal(res2.status, 200);
		const time2 = Number.parseInt(
			cheerio
				.load(await res2.text())('#time')
				.text(),
		);

		assert.notEqual(time1, time2);
	});
});
