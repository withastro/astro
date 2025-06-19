import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';

const root = new URL('./fixtures/static-headers/', import.meta.url);
let headersByPattern;

before(async () => {
	const fixture = await loadFixture({ root, experimental: { csp: true } });
	await fixture.build();
	const content = await fixture.readFile('./_headers');
	headersByPattern = parseHeadersFile(content);
});

describe('Static headers merging + CSP', () => {
	it('merges existing Surrogate-Key + CSP on /has-header', () => {
		const hdr = headersByPattern.get('/has-header');
		assert.ok(hdr, 'expected /has-header');
		assert.equal(hdr['Surrogate-Key'], 'has-header');
		assert.equal(hdr['X-Robots-Tag'], 'noindex');
		assert.ok(hdr['Content-Security-Policy']);
	});

	it('merges Surrogate-Key + CSP on dynamic blog-post /blog/:post', () => {
		const hdr = headersByPattern.get('/blog/:post');
		assert.ok(hdr, 'expected /blog/:post');
		assert.equal(hdr['Surrogate-Key'], 'blog-post');
		assert.ok(hdr['Content-Security-Policy']);
	});

	it('merges Surrogate-Key + CSP on parent dynamic /parent/*/page', () => {
		const hdr = headersByPattern.get('/parent/*/page');
		assert.ok(hdr, 'expected /parent/*/page');
		assert.equal(hdr['Surrogate-Key'], 'parent-page');
		assert.ok(hdr['Content-Security-Policy']);
	});

	it('merges Surrogate-Key + CSP on root /', () => {
		const hdr = headersByPattern.get('/');
		assert.ok(hdr, 'expected /');
		assert.equal(hdr['Surrogate-Key'], 'root');
		assert.ok(hdr['Content-Security-Policy']);
	});

	it('merges Surrogate-Key + CSP on catch-all /*', () => {
		const hdr = headersByPattern.get('/*');
		assert.ok(hdr, 'expected /*');
		assert.equal(hdr['Surrogate-Key'], 'catch-all');
		assert.ok(hdr['Content-Security-Policy']);
	});

	it('only applies CSP to when no custom header is set', () => {
		const hdr = headersByPattern.get('/blank');
		assert.ok(hdr, 'expected /blank');
		assert.equal(hdr['Surrogate-Key'], undefined, 'Surrogate-Key should not be set on /blank');
		assert.ok(hdr['Content-Security-Policy'], 'CSP should be set on /blank');
	});

	it('copies over custom headers verbatim on unknown paths', () => {
		const hdr = headersByPattern.get('/unknown-route');
		assert.ok(hdr, 'expected /unknown-route');
		assert.equal(hdr['Surrogate-Key'], 'unknown-route');
		assert.equal(hdr['Content-Security-Policy'], undefined, 'CSP should not be set on /unknown');
	});
});

function parseHeadersFile(content) {
	const map = new Map();
	let current = null;
	for (const line of content.split(/\r?\n/)) {
		if (!line.trim()) continue;
		if (!/^[ \t]/.test(line)) {
			current = line.trim();
			map.set(current, map.get(current) || {});
		} else if (current) {
			const [k, ...rest] = line.trim().split(':');
			map.get(current)[k.trim()] = rest.join(':').trim();
		}
	}
	return map;
}
