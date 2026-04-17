import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

describe('Cloudflare cache provider', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;
	let previewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-provider/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer?.stop();
	});

	it('sets Cloudflare-CDN-Cache-Control and Cache-Tag from cache.set()', async () => {
		const res = await fixture.fetch('/api');
		assert.equal(res.status, 200);

		const cacheControl = res.headers.get('Cloudflare-CDN-Cache-Control');
		assert.ok(cacheControl, 'Cloudflare-CDN-Cache-Control header should be present');
		assert.ok(cacheControl.includes('public'), `expected public, got: ${cacheControl}`);
		assert.ok(cacheControl.includes('max-age=300'), `expected max-age=300, got: ${cacheControl}`);
		assert.ok(
			cacheControl.includes('stale-while-revalidate=60'),
			`expected stale-while-revalidate=60, got: ${cacheControl}`,
		);

		// The generic CDN-Cache-Control header must not be set; Cloudflare-specific takes precedence.
		assert.equal(res.headers.get('CDN-Cache-Control'), null);

		const cacheTag = res.headers.get('Cache-Tag');
		assert.ok(cacheTag, 'Cache-Tag header should be present');
		const tags = cacheTag.split(',');
		assert.ok(tags.includes('api'), `expected 'api' in Cache-Tag, got: ${cacheTag}`);
		assert.ok(tags.includes('data'), `expected 'data' in Cache-Tag, got: ${cacheTag}`);
		// Path is auto-tagged for path-based invalidation.
		assert.ok(
			tags.includes('astro-path:/api'),
			`expected 'astro-path:/api' in Cache-Tag, got: ${cacheTag}`,
		);
	});

	it('applies routeRules cache options and auto path-tags', async () => {
		const res = await fixture.fetch('/tagged');
		assert.equal(res.status, 200);

		const cacheControl = res.headers.get('Cloudflare-CDN-Cache-Control');
		assert.ok(cacheControl, 'Cloudflare-CDN-Cache-Control header should be present');
		assert.ok(cacheControl.includes('max-age=600'), `expected max-age=600, got: ${cacheControl}`);

		const cacheTag = res.headers.get('Cache-Tag');
		assert.ok(cacheTag, 'Cache-Tag header should be present');
		const tags = cacheTag.split(',');
		assert.ok(tags.includes('products'), `expected 'products' tag, got: ${cacheTag}`);
		assert.ok(
			tags.includes('astro-path:/tagged'),
			`expected 'astro-path:/tagged' tag, got: ${cacheTag}`,
		);
	});

	it('includes a version tag when CF_VERSION_METADATA is configured', async () => {
		const res = await fixture.fetch('/api');
		const cacheTag = res.headers.get('Cache-Tag');
		assert.ok(cacheTag, 'Cache-Tag header should be present');
		const versionTag = cacheTag.split(',').find((t) => t.startsWith('astro-version:'));
		assert.ok(
			versionTag,
			`expected an 'astro-version:' tag when CF_VERSION_METADATA is set, got: ${cacheTag}`,
		);
		assert.ok(
			versionTag.length > 'astro-version:'.length,
			`expected a non-empty version id, got: ${versionTag}`,
		);
	});

	it('defaults to no-store for responses with no cache rules', async () => {
		const res = await fixture.fetch('/uncached');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
		// Nothing to invalidate, so no Cache-Tag should be emitted.
		assert.equal(res.headers.get('Cache-Tag'), null);
	});

	it('defaults to no-store when cache.set(false) is called', async () => {
		const res = await fixture.fetch('/no-cache');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
		assert.equal(res.headers.get('Cache-Tag'), null);
	});
});
