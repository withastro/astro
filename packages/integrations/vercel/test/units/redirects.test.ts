import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRedirects } from '../../dist/lib/redirects.js';

/** Minimal AstroConfig stub with only the fields getRedirects reads. */
function fakeConfig(trailingSlash = 'ignore', base = '/') {
	return /** @type {any} */ { base, trailingSlash };
}

/** Minimal IntegrationResolvedRoute stub for a redirect. */
function fakeRedirectRoute(pattern, redirect, segments) {
	return /** @type {any} */ { type: 'redirect', pattern, redirect, segments };
}

describe('getRedirects', () => {
	const staticSegments = [[{ content: 'old', dynamic: false, spread: false }]];
	const spreadSegments = [
		[{ content: 'blog', dynamic: false, spread: false }],
		[{ content: 'slug', dynamic: true, spread: true }],
	];
	const extensionSegments = [
		[{ content: 'Basic', dynamic: false, spread: false }],
		[{ content: 'http-2-0.html', dynamic: false, spread: false }],
	];
	const dynamicSegments = [
		[{ content: 'blog', dynamic: false, spread: false }],
		[{ content: 'slug', dynamic: true, spread: false }],
	];

	it('appends trailing slash to extensionless source when trailingSlash is always', () => {
		const routes = [fakeRedirectRoute('/old', '/new/', staticSegments)];
		const redirects = getRedirects(routes, fakeConfig('always'));
		assert.equal(redirects[0].source, '/old/');
	});

	it('does not append trailing slash to extension source when trailingSlash is always', () => {
		const routes = [fakeRedirectRoute('/Basic/http-2-0.html', '/posts/http2', extensionSegments)];
		const redirects = getRedirects(routes, fakeConfig('always'));
		assert.equal(redirects[0].source, '/Basic/http-2-0.html');
	});

	it('does not append trailing slash to spread source when trailingSlash is always', () => {
		const routes = [fakeRedirectRoute('/blog/[...slug]', '/team/articles/[...slug]', spreadSegments)];
		const redirects = getRedirects(routes, fakeConfig('always'));
		assert.equal(redirects[0].source, '/blog/:slug*');
	});

	it('appends trailing slash to dynamic (non-spread) source when trailingSlash is always', () => {
		const routes = [fakeRedirectRoute('/blog/[slug]', '/posts/[slug]', dynamicSegments)];
		const redirects = getRedirects(routes, fakeConfig('always'));
		assert.equal(redirects[0].source, '/blog/:slug/');
	});

	it('does not append trailing slash to root path when trailingSlash is always', () => {
		const routes = [fakeRedirectRoute('/', '/home', [])];
		const redirects = getRedirects(routes, fakeConfig('always'));
		assert.equal(redirects[0].source, '/');
	});

	it('does not append trailing slash when trailingSlash is never', () => {
		const routes = [fakeRedirectRoute('/old', '/new', staticSegments)];
		const redirects = getRedirects(routes, fakeConfig('never'));
		assert.equal(redirects[0].source, '/old');
	});

	it('does not append trailing slash when trailingSlash is ignore', () => {
		const routes = [fakeRedirectRoute('/old', '/new', staticSegments)];
		const redirects = getRedirects(routes, fakeConfig('ignore'));
		assert.equal(redirects[0].source, '/old');
	});
});
