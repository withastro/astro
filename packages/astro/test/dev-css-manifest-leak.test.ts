import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Dev CSS graph boundaries with astro:config/server', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(
		async () => {
			fixture = await loadFixture({
				root: './fixtures/dev-css-manifest-leak-basic/',
				outDir: './dist/dev-css-manifest-leak/',
				// Needs on-demand rendered routes to reproduce: the manifest fan-out this
				// test guards against only reaches routes reachable from the dev "ssr"
				// environment's virtual:astro:pages, which excludes prerendered routes.
				output: 'server',
				adapter: testAdapter(),
			});
			devServer = await fixture.startDevServer();
		},
		{ timeout: 30000 },
	);

	after(async () => {
		await devServer.stop();
	});

	async function getPageCss(pathname: string) {
		const html = await fixture.fetch(pathname).then((res) => res.text());
		return cheerio.load(html)('style').text();
	}

	it('does not attach docs-only CSS to unrelated pages', async () => {
		const css = await getPageCss('/');
		assert.match(css, /background:\s*white/);
		assert.doesNotMatch(css, /background:\s*black/);
		assert.doesNotMatch(css, /color:\s*red/);
	});

	it('keeps docs-only CSS on the docs page', async () => {
		const css = await getPageCss('/docs/');
		assert.match(css, /background:\s*black/);
		assert.match(css, /color:\s*red/);
		assert.doesNotMatch(css, /background:\s*white/);
	});
});
