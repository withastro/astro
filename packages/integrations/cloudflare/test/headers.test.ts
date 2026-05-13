import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { headersFileHasCacheControlForPath } from '../src/utils/headers.ts';

describe('headersFileHasCacheControlForPath', () => {
	it('returns false for an empty file', () => {
		assert.equal(headersFileHasCacheControlForPath('', '/_astro/probe'), false);
	});

	it('detects an exact-pattern Cache-Control rule', () => {
		const content = ['/_astro/*', '  Cache-Control: max-age=60', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});

	it('detects a global splat rule that matches the assets path', () => {
		// The dedup must not be fooled by the user putting Cache-Control on `/*`,
		// since Cloudflare merges matching rules' headers with a comma.
		const content = ['/*', '  Cache-Control: no-cache', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});

	it('detects a Cache-Control detach (! prefix) on a matching rule', () => {
		// `! Cache-Control` is a deliberate user instruction; respect it.
		const content = ['/_astro/*', '  ! Cache-Control', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});

	it('returns false when Cache-Control is on a non-matching rule', () => {
		const content = ['/api/*', '  Cache-Control: no-store', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), false);
	});

	it('returns false when only non-Cache-Control headers exist on matching rules', () => {
		const content = ['/*', '  X-Custom: 1', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), false);
	});

	it('matches placeholder patterns against the assets path', () => {
		// `:dir` matches a single path segment.
		const content = ['/:dir/*', '  Cache-Control: max-age=0', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});

	it('does not match placeholder when the path has the wrong shape', () => {
		// `:dir` cannot span a `/`.
		const content = ['/:dir', '  Cache-Control: max-age=0', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), false);
	});

	it('respects host-prefixed patterns', () => {
		const content = ['https://example.com/_astro/*', '  Cache-Control: max-age=60', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});

	it('ignores comments and blank lines', () => {
		const content = ['# a comment', '', '/api/*', '  X-Foo: bar', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), false);
	});

	it('matches a base-prefixed assets path', () => {
		const content = ['/blog/_astro/*', '  Cache-Control: max-age=10', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/blog/_astro/probe'), true);
	});

	it('case-insensitive on the Cache-Control header name', () => {
		const content = ['/*', '  cache-control: no-cache', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});

	// Tests for non-default build.assets (e.g. build.assets: '_custom')
	it('detects a Cache-Control rule for a custom assets dir', () => {
		const content = ['/_custom/*', '  Cache-Control: max-age=60', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_custom/probe'), true);
	});

	it('does not match _astro/* rule when the probe path uses a custom assets dir', () => {
		const content = ['/_astro/*', '  Cache-Control: max-age=60', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_custom/probe'), false);
	});

	it('does not match _custom/* rule when the probe path uses the default assets dir', () => {
		const content = ['/_custom/*', '  Cache-Control: max-age=60', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), false);
	});

	it('handles CRLF line endings correctly', () => {
		const content = ['/_astro/*', '  Cache-Control: max-age=60', ''].join('\r\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});

	it('treats Cache-Control with no value as set', () => {
		// An empty value still sets the header to empty per CF docs — treat as present.
		const content = ['/_astro/*', '  Cache-Control:', ''].join('\n');
		assert.equal(headersFileHasCacheControlForPath(content, '/_astro/probe'), true);
	});
});
