import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture, type DevServer, type Fixture } from './test-utils.ts';

describe('CSS - dynamic import in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let $: cheerio.CheerioAPI;

	before(
		async () => {
			fixture = await loadFixture({
				root: './fixtures/css-dynamic-import-dev/',
				outDir: './dist/css-dynamic-import-dev/',
			});
			devServer = await fixture.startDevServer();
			const html = await fixture.fetch('/').then((res) => res.text());
			$ = cheerio.load(html);
		},
		{ timeout: 30000 },
	);

	after(async () => {
		await devServer.stop();
	});

	it('injects styles from a dynamically imported component on first load', () => {
		// Styles must be present on the very first request, not only after HMR.
		// Regression: in Astro 6, collectCSSWithOrder() skipped untransformed
		// dynamic imports, so the <style> was missing until a file was saved.
		const allStyles = $('style').text();
		assert.ok(allStyles.includes('salmon'), 'Expected styles from Layout.astro to be injected');
	});
});
