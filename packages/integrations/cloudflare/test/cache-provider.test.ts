import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('Cloudflare cache provider', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer | undefined;

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

	it('tags cacheable responses with the Worker version', async () => {
		const res = await fixture.fetch('/api');
		const cacheTag = res.headers.get('Cache-Tag');
		assert.ok(cacheTag, 'Cache-Tag header should be present');

		const versionTag = cacheTag.split(',').find((tag) => tag.startsWith('astro-version:'));
		assert.ok(versionTag, `expected an 'astro-version:' tag, got: ${cacheTag}`);
		assert.ok(
			versionTag.length > 'astro-version:'.length,
			`expected a non-empty version id, got: ${versionTag}`,
		);
	});

	it('folds the Worker version into the ETag of a response with lastModified', async () => {
		const res = await fixture.fetch('/lastmod');
		assert.equal(res.status, 200);

		const lastModified = res.headers.get('Last-Modified');
		assert.equal(lastModified, new Date('2026-01-15T10:00:00.000Z').toUTCString());
		assert.equal(res.headers.get('Cache-Control'), 'no-cache');

		const etag = res.headers.get('ETag');
		assert.ok(etag, 'ETag header should be present');

		const match = /^W\/"(.+):(\d+)"$/.exec(etag);
		assert.ok(match, `expected a weak versioned ETag, got: ${etag}`);
		assert.equal(Number(match[2]), Date.parse('2026-01-15T10:00:00.000Z'));

		const versionTag = res.headers
			.get('Cache-Tag')
			?.split(',')
			.find((tag) => tag.startsWith('astro-version:'));
		assert.equal(
			versionTag,
			`astro-version:${match[1]}`,
			'ETag and Cache-Tag should carry the same version id',
		);
	});

	it('leaves an explicitly provided ETag untouched', async () => {
		const res = await fixture.fetch('/explicit-etag');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('ETag'), '"user-supplied"');
	});

	it('does not mint an ETag for a cacheable response without a validator', async () => {
		const res = await fixture.fetch('/api');
		assert.equal(res.status, 200);
		assert.equal(res.headers.get('Last-Modified'), null);
		assert.equal(res.headers.get('ETag'), null);
	});
});
