import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// `findRouteToRewrite` used to commit to the first route whose pattern matched,
// because its only rejection branch reads `route.distURL`, which is populated
// only while a build writes files. In `astro dev` that made an overlapping
// dynamic route that owns nothing shadow the route that does own the path.
describe('rewriting to a path owned by a later dynamic route', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/rewrite-overlapping-dynamic-routes/',
			outDir: './dist/rewrite-overlapping-dynamic-routes/',
			cacheDir: './node_modules/.astro-test/rewrite-overlapping-dynamic-routes/',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('renders the target when an earlier dynamic route matches the pattern but owns no path', async () => {
		const res = await fixture.fetch('/rewrite-me/');
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Slug alpha');
	});

	it('still serves the same path on an ordinary request', async () => {
		const res = await fixture.fetch('/alpha/');
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('h1').text(), 'Slug alpha');
	});
});
