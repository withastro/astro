import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import woof from './fixtures/multiple-jsx-renderers/renderers/woof/index.mjs';
import meow from './fixtures/multiple-jsx-renderers/renderers/meow/index.mjs';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

const multiCdnAssetsPrefix = {
	js: 'https://js.example.com',
	css: 'https://css.example.com',
	fallback: 'https://example.com',
};

describe('Asset Query Parameters (Adapter Client Config)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
		});
		await fixture.build();
	});

	it('appends assetQueryParams to stylesheet URLs in SSR', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const stylesheets = $('link[rel="stylesheet"]');
		assert.ok(stylesheets.length > 0, 'Should have at least one stylesheet');
		stylesheets.each((_i, el) => {
			const href = $(el).attr('href')!;
			assert.match(
				href,
				/\?dpl=test-deploy-id/,
				`Stylesheet href should include assetQueryParams: ${href}`,
			);
		});
	});

	it('appends assetQueryParams to Image component src', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const image = $('img#test-image');
		assert.ok(image.length > 0, 'Should have image with id="test-image"');
		const src = image.attr('src')!;
		assert.match(src, /dpl=test-deploy-id/, `Image src should include assetQueryParams: ${src}`);
	});
});

describe('Asset Query Parameters with Fonts', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/fonts/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
		});
		await fixture.build();
	});

	it('appends assetQueryParams to font requests', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/preload');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const fontLinks = $('link[rel="preload"][as="font"]');
		assert.ok(fontLinks.length > 0, 'Should have at least one font preload link');
		fontLinks.each((_i, el) => {
			const href = $(el).attr('href')!;
			assert.match(
				href,
				/dpl=test-deploy-id/,
				`Font href should include assetQueryParams: ${href}`,
			);
		});
	});
});

describe('Asset Query Parameters with Islands', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/multiple-jsx-renderers/',
			output: 'server',
			integrations: [woof({ include: '**/*.woof.jsx' }), meow({ include: '**/*.meow.jsx' })],
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
		});
		await fixture.build();
	});

	it('appends assetQueryParams to astro-island component and renderer URLs', async () => {
		const app = await fixture.loadTestAdapterApp();
		const response = await app.render(new Request('http://example.com/client-load'));
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const island = $('astro-island').first();

		assert.ok(island.length > 0, 'Should have at least one astro-island');
		const componentUrl = island.attr('component-url')!;
		const rendererUrl = island.attr('renderer-url')!;
		assert.match(
			componentUrl,
			/\?dpl=test-deploy-id/,
			`astro-island component-url should include assetQueryParams: ${componentUrl}`,
		);
		assert.match(
			rendererUrl,
			/\?dpl=test-deploy-id/,
			`astro-island renderer-url should include assetQueryParams: ${rendererUrl}`,
		);
	});
});

describe('Asset Query Parameters in Inter-Chunk JS Imports', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/asset-query-params-chunks/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
		});
		await fixture.build();
	});

	it('appends assetQueryParams to relative imports inside client JS chunks', async () => {
		const app = await fixture.loadTestAdapterApp();
		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const scripts = $('script[src]');
		assert.ok(scripts.length > 0, 'Should have at least one external script');

		let foundStaticImport = false;
		let foundDynamicImport = false;
		// Read all client JS files and check inter-chunk imports have query params
		const jsFiles = await fixture.glob('client/**/*.js');
		for (const file of jsFiles) {
			const code = await fixture.readFile(`/${file}`);
			// Match static imports: from "./chunk.js", from "./chunk.js"
			const staticImports = [
				...code.matchAll(/from\s*["'](\.\.?\/[^"']+\.(?:js|mjs)(?:\?[^"']*)?)["']/g),
			];
			// Match dynamic imports: import("./chunk.js")
			const dynamicImports = [
				...code.matchAll(/import\s*\(\s*["'](\.\.?\/[^"']+\.(?:js|mjs)(?:\?[^"']*)?)["']/g),
			];
			for (const match of staticImports) {
				foundStaticImport = true;
				const importPath = match[1];
				assert.match(
					importPath,
					/\?dpl=test-deploy-id/,
					`Static inter-chunk import should include assetQueryParams: ${match[0]}`,
				);
			}
			for (const match of dynamicImports) {
				foundDynamicImport = true;
				const importPath = match[1];
				assert.match(
					importPath,
					/\?dpl=test-deploy-id/,
					`Dynamic inter-chunk import should include assetQueryParams: ${match[0]}`,
				);
			}
		}
		assert.ok(
			foundStaticImport,
			'Expected at least one static relative inter-chunk import in client JS files',
		);
		assert.ok(
			foundDynamicImport,
			'Expected at least one dynamic relative inter-chunk import in client JS files',
		);
	});
});

describe('Asset Query Parameters with Islands and assetsPrefix map', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-assets-prefix/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
			build: {
				assetsPrefix: multiCdnAssetsPrefix,
			},
		});
		await fixture.build();
	});

	it('uses js assetsPrefix for island URLs while appending assetQueryParams', async () => {
		const app = await fixture.loadTestAdapterApp();
		const response = await app.render(new Request('http://example.com/custom-base/'));
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		const island = $('astro-island').first();

		assert.ok(island.length > 0, 'Should have at least one astro-island');
		const componentUrl = island.attr('component-url')!;
		const rendererUrl = island.attr('renderer-url')!;
		assert.match(
			componentUrl,
			/^https:\/\/js\.example\.com\/_astro\/.*\?dpl=test-deploy-id$/,
			`astro-island component-url should use js assetsPrefix and include assetQueryParams: ${componentUrl}`,
		);
		assert.match(
			rendererUrl,
			/^https:\/\/js\.example\.com\/_astro\/.*\?dpl=test-deploy-id$/,
			`astro-island renderer-url should use js assetsPrefix and include assetQueryParams: ${rendererUrl}`,
		);
	});
});
