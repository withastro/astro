import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture, getVercelConfig } from './test-utils.ts';

describe('Redirects', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/redirects/',
			redirects: {
				'/one': '/',
				'/two': '/',
				'/three': {
					status: 302,
					destination: '/',
				},
				'/four': {
					status: 302,
					destination: 'http://example.com',
				},
				'/blog/[...slug]': '/team/articles/[...slug]',
				'/Basic/http-2-0.html': '/posts/http2',
				'/release-1.0-beta': '/posts/release',
			},
			trailingSlash: 'always',
		});
		await fixture.build({});
	});

	it('define static routes', { timeout: 30000 }, async () => {
		const config = await getVercelConfig(fixture);
		const oneRoute = config.routes.find((r) => r.src === '^/one/$')!;
		assert.equal(oneRoute.headers['Location'], '/');
		assert.equal(oneRoute.status, 301);

		const twoRoute = config.routes.find((r) => r.src === '^/two/$')!;
		assert.equal(twoRoute.headers['Location'], '/');
		assert.equal(twoRoute.status, 301);

		const threeRoute = config.routes.find((r) => r.src === '^/three/$')!;
		assert.equal(threeRoute.headers['Location'], '/');
		assert.equal(threeRoute.status, 302);

		const fourRoute = config.routes.find((r) => r.src === '^/four/$')!;
		assert.equal(fourRoute.headers['Location'], 'http://example.com');
		assert.equal(fourRoute.status, 302);
	});

	it('define redirects for static files', { timeout: 30000 }, async () => {
		const config = await getVercelConfig(fixture);

		const staticRoute = config.routes.find((r) => r.src === '^/Basic/http-2-0\\.html$')!;
		assert.notEqual(staticRoute, undefined);
		assert.equal(staticRoute.headers['Location'], '/posts/http2');
		assert.equal(staticRoute.status, 301);
	});

	it('does not add a slash Vercel would never add', { timeout: 30000 }, async () => {
		const config = await getVercelConfig(fixture);

		const dottedRoute = config.routes.find((r) => r.src === '^/release-1\\.0-beta$')!;
		assert.notEqual(dottedRoute, undefined);
		assert.equal(dottedRoute.headers['Location'], '/posts/release');
		assert.equal(
			config.routes.some((r) => r.src === '^/release-1\\.0-beta/$'),
			false,
			'a dotted path is never normalized to a slash by Vercel',
		);
	});

	it('defines dynamic routes', { timeout: 30000 }, async () => {
		const config = await getVercelConfig(fixture);

		const blogRoute = config.routes.find(
			(r) => r.src === '^/blog(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?/$',
		)!;
		assert.notEqual(blogRoute, undefined);
		assert.equal(blogRoute.headers['Location'].startsWith('/team/articles'), true);
		assert.equal(blogRoute.status, 301);

		// A spread value may contain a dot, which Vercel never slashes, so the
		// unslashed form has to stay matchable too.
		const unslashedBlogRoute = config.routes.find(
			(r) => r.src === '^/blog(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$',
		)!;
		assert.notEqual(unslashedBlogRoute, undefined);
		assert.equal(unslashedBlogRoute.headers['Location'].startsWith('/team/articles'), true);
	});

	it('emits the assets cache rule after redirects and before the filesystem handle', async () => {
		const config = await getVercelConfig(fixture);

		const cacheIndex = config.routes.findIndex(
			(r) => r.headers?.['cache-control'] === 'public, max-age=31536000, immutable',
		);
		const handleIndex = config.routes.findIndex((r) => r.handle === 'filesystem');
		const lastRedirectIndex = config.routes.findLastIndex(
			(r) => r.status === 301 || r.status === 308,
		);
		assert.notEqual(cacheIndex, -1);
		assert.notEqual(handleIndex, -1);
		assert.notEqual(lastRedirectIndex, -1);
		assert.ok(lastRedirectIndex < cacheIndex && cacheIndex < handleIndex);
	});

	it('throws an error for invalid redirects', { timeout: 30000 }, async () => {
		const fails = await loadFixture({
			root: './fixtures/redirects/',
			redirects: {
				// Invalid source syntax
				'/blog/(![...slug]': '/team/articles/[...slug]',
			},
		});
		await assert.rejects(() => fails.build({}), {
			name: 'AstroUserError',
			message:
				'Error generating redirects: Redirect at index 0 has invalid `source` regular expression "/blog/(!:slug*".',
		});
	});
});
