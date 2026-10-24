import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig, IntegrationResolvedRoute, RoutePart } from 'astro';
import { getRedirects } from '../../dist/lib/redirects.js';

function staticPart(content: string): RoutePart {
	return { content, dynamic: false, spread: false };
}

function dynamicPart(content: string): RoutePart {
	return { content, dynamic: true, spread: false };
}

function spreadPart(content: string): RoutePart {
	return { content, dynamic: true, spread: true };
}

function makeRedirectRoute(segments: RoutePart[][]): IntegrationResolvedRoute {
	return {
		type: 'redirect',
		segments,
		redirect: '/new/',
	} as unknown as IntegrationResolvedRoute;
}

function makeConfig(
	trailingSlash: AstroConfig['trailingSlash'],
	base: AstroConfig['base'] = '/',
): AstroConfig {
	return { base, trailingSlash } as AstroConfig;
}

describe('getRedirects trailingSlash', () => {
	it('appends a slash to static sources when trailingSlash is always', () => {
		const routes = [makeRedirectRoute([[staticPart('old')]])];
		const redirects = getRedirects(routes, makeConfig('always'));
		assert.equal(redirects[0].source, '/old/');
	});

	it('leaves the root source alone when trailingSlash is always', () => {
		const routes = [makeRedirectRoute([])];
		const redirects = getRedirects(routes, makeConfig('always'));
		assert.equal(redirects[0].source, '/');
	});

	it('emits slashed and unslashed rules for dynamic sources when trailingSlash is always', () => {
		const routes = [makeRedirectRoute([[staticPart('blog')], [dynamicPart('slug')]])];
		const redirects = getRedirects(routes, makeConfig('always'));
		assert.deepEqual(
			redirects.map((redirect) => redirect.source),
			['/blog/:slug/', '/blog/:slug'],
		);
	});

	it('emits slashed and unslashed rules for spread sources when trailingSlash is always', () => {
		const routes = [makeRedirectRoute([[staticPart('blog')], [spreadPart('...slug')]])];
		const redirects = getRedirects(routes, makeConfig('always'));
		assert.deepEqual(
			redirects.map((redirect) => redirect.source),
			['/blog/:slug*/', '/blog/:slug*'],
		);
	});

	it('keeps the destination and status on both dynamic rules', () => {
		const routes = [makeRedirectRoute([[staticPart('blog')], [spreadPart('...slug')]])];
		const redirects = getRedirects(routes, makeConfig('always'));
		for (const redirect of redirects) {
			assert.equal(redirect.destination, '/new/');
			assert.equal(redirect.statusCode, 301);
		}
	});

	it('skips file-extension sources when trailingSlash is always', () => {
		const routes = [makeRedirectRoute([[staticPart('Basic')], [staticPart('http-2-0.html')]])];
		const redirects = getRedirects(routes, makeConfig('always'));
		assert.equal(redirects[0].source, '/Basic/http-2-0.html');
	});

	it('leaves dotted non-extension sources unslashed when trailingSlash is always', () => {
		const routes = [
			makeRedirectRoute([[staticPart('release-1.0-beta')]]),
			makeRedirectRoute([[staticPart('v2.0-notes')]]),
		];
		const redirects = getRedirects(routes, makeConfig('always'));
		assert.deepEqual(
			redirects.map((redirect) => redirect.source),
			['/release-1.0-beta', '/v2.0-notes'],
		);
	});

	it('leaves static sources alone when trailingSlash is never', () => {
		const routes = [makeRedirectRoute([[staticPart('old')]])];
		const redirects = getRedirects(routes, makeConfig('never'));
		assert.equal(redirects[0].source, '/old');
	});

	it('leaves static sources alone when trailingSlash is ignore', () => {
		const routes = [makeRedirectRoute([[staticPart('old')]])];
		const redirects = getRedirects(routes, makeConfig('ignore'));
		assert.equal(redirects[0].source, '/old');
	});
});
