import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('SSR Hydrated component scripts', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-scripts/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/ssr-scripts/',
		});
		await fixture.build();
	});

	it('Are included in the manifest.assets so that an adapter can know to serve static', async () => {
		const app = await fixture.loadTestAdapterApp();

		const assets = app.manifest.assets;
		assert.ok(assets.size > 0);
	});

	it('import.meta.env.SSR is true', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/ssr');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('#ssr').text(), 'true');
	});
});
