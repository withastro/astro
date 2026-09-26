import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { hasMetaRefreshTo, redirectTemplate } from '../../../dist/core/routing/3xx.js';

describe('redirects/template', () => {
	it('generates correct HTML structure', () => {
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: 'https://example.com/new-page',
			relativeLocation: '/new-page',
		});

		const $ = cheerio.load(html);

		// Check DOCTYPE
		assert.ok(html.startsWith('<!doctype html>'));

		// Check title
		assert.equal($('title').text(), 'Redirecting to: /new-page');

		// Check meta refresh tag
		const metaRefresh = $('meta[http-equiv="refresh"]');
		assert.equal(metaRefresh.length, 1);
		assert.equal(metaRefresh.attr('content'), '0;url=/new-page');

		// Check robots meta tag
		const metaRobots = $('meta[name="robots"]');
		assert.equal(metaRobots.length, 1);
		assert.equal(metaRobots.attr('content'), 'noindex');

		// Check canonical link
		const canonical = $('link[rel="canonical"]');
		assert.equal(canonical.length, 1);
		assert.equal(canonical.attr('href'), 'https://example.com/new-page');

		// Check body content
		const link = $('body a');
		assert.equal(link.length, 1);
		assert.equal(link.attr('href'), '/new-page');
		assert.ok(link.html()?.includes('Redirecting'));
		assert.ok(link.html()?.includes('/new-page'));
	});

	it('uses 2 second delay for 302 redirects', () => {
		const html = redirectTemplate({
			status: 302,
			absoluteLocation: 'https://example.com/temp',
			relativeLocation: '/temp',
		});

		const $ = cheerio.load(html);
		const metaRefresh = $('meta[http-equiv="refresh"]');
		assert.equal(metaRefresh.attr('content'), '2;url=/temp');
	});

	it('uses 0 second delay for non-302 redirects', () => {
		// Test 301
		let html = redirectTemplate({
			status: 301,
			absoluteLocation: 'https://example.com/perm',
			relativeLocation: '/perm',
		});

		let $ = cheerio.load(html);
		let metaRefresh = $('meta[http-equiv="refresh"]');
		assert.equal(metaRefresh.attr('content'), '0;url=/perm');

		// Test 308
		html = redirectTemplate({
			status: 308,
			absoluteLocation: 'https://example.com/perm',
			relativeLocation: '/perm',
		});

		$ = cheerio.load(html);
		metaRefresh = $('meta[http-equiv="refresh"]');
		assert.equal(metaRefresh.attr('content'), '0;url=/perm');
	});

	it('includes "from" information when provided', () => {
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: 'https://example.com/new',
			relativeLocation: '/new',
			from: '/old',
		});

		const $ = cheerio.load(html);
		const bodyText = $('body').html();
		assert.ok(bodyText?.includes('from <code>/old</code>'));
		assert.ok(bodyText?.includes('to <code>/new</code>'));
	});

	it('omits "from" text when not provided', () => {
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: 'https://example.com/new',
			relativeLocation: '/new',
		});

		const $ = cheerio.load(html);
		const bodyText = $('body').html();
		assert.ok(!bodyText?.includes('from <code>'));
		assert.ok(bodyText?.includes('to <code>/new</code>'));
	});

	it('handles special characters in URLs', () => {
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: 'https://example.com/page?foo=bar&baz=qux',
			relativeLocation: '/page?foo=bar&baz=qux',
		});

		const $ = cheerio.load(html);

		// Title should show the URL as-is
		assert.equal($('title').text(), 'Redirecting to: /page?foo=bar&baz=qux');

		// Meta refresh should preserve the URL structure
		const metaRefresh = $('meta[http-equiv="refresh"]');
		assert.equal(metaRefresh.attr('content'), '0;url=/page?foo=bar&baz=qux');

		// Link href should be properly escaped
		const link = $('body a');
		assert.equal(link.attr('href'), '/page?foo=bar&baz=qux');
	});

	it('handles external URLs in relative location', () => {
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: 'https://external.com/',
			relativeLocation: 'https://external.com/',
		});

		const $ = cheerio.load(html);

		// Should use the external URL in all places
		assert.equal($('title').text(), 'Redirecting to: https://external.com/');
		assert.equal($('meta[http-equiv="refresh"]').attr('content'), '0;url=https://external.com/');
		assert.equal($('link[rel="canonical"]').attr('href'), 'https://external.com/');
		assert.equal($('body a').attr('href'), 'https://external.com/');
	});

	it('handles URL object for absoluteLocation', () => {
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: new URL('https://example.com/page'),
			relativeLocation: '/page',
		});

		const $ = cheerio.load(html);

		// Should convert URL object to string
		assert.equal($('link[rel="canonical"]').attr('href'), 'https://example.com/page');
	});
});

describe('redirects/hasMetaRefreshTo', () => {
	it('accepts the tag emitted by the built-in template', () => {
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: 'https://example.com/new-page',
			relativeLocation: '/new-page',
		});

		assert.equal(hasMetaRefreshTo(html, '/new-page'), true);
	});

	it('accepts single quotes, extra whitespace and reordered attributes', () => {
		assert.equal(
			hasMetaRefreshTo(`<meta content='0; url = /new' http-equiv='refresh'>`, '/new'),
			true,
		);
	});

	it('rejects a tag pointing somewhere else', () => {
		assert.equal(
			hasMetaRefreshTo('<meta http-equiv="refresh" content="0;url=/other">', '/new'),
			false,
		);
	});

	it('rejects a document with no refresh tag', () => {
		assert.equal(
			hasMetaRefreshTo('<html><body><a href="/new">Go</a></body></html>', '/new'),
			false,
		);
	});

	it('ignores non-refresh meta tags with a matching content value', () => {
		assert.equal(hasMetaRefreshTo('<meta name="robots" content="0;url=/new">', '/new'), false);
	});

	it('matches a destination whose escaped entities differ from the raw location', () => {
		// Both Astro's renderer and `redirectTemplate` escape attribute values, so
		// `&` reaches the parser as `&amp;`. See PR #18015 review.
		const to = '/new?a=1&b=2';
		const html = redirectTemplate({
			status: 301,
			absoluteLocation: `https://example.com${to}`,
			relativeLocation: to,
		});

		assert.match(html, /content="0;url=\/new\?a=1&amp;b=2"/);
		assert.equal(hasMetaRefreshTo(html, to), true);
	});

	it('decodes the other entities Astro escapes', () => {
		assert.equal(
			hasMetaRefreshTo(
				`<meta http-equiv="refresh" content="0;url=/a?q=&#39;x&#39;&amp;b=&quot;y&quot;">`,
				`/a?q='x'&b="y"`,
			),
			true,
		);
	});

	it('still rejects a destination that only looks similar once decoded', () => {
		assert.equal(
			hasMetaRefreshTo(
				'<meta http-equiv="refresh" content="0;url=/new?a=1&amp;b=2">',
				'/new?a=1&b=3',
			),
			false,
		);
	});

	it('finds the tag among several meta tags', () => {
		const html = [
			'<meta charset="utf-8">',
			'<meta http-equiv="refresh" content="2;url=/new">',
			'<meta name="robots" content="noindex">',
		].join('\n');

		assert.equal(hasMetaRefreshTo(html, '/new'), true);
	});
});
