import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import factory from '../dist/cache/provider.js';

const provider = factory(undefined);
const dummyRequest = new Request('http://localhost/products/123');

describe('Vercel cache provider', () => {
	describe('setHeaders', () => {
		it('sets Vercel-CDN-Cache-Control with public and max-age', () => {
			const headers = provider.setHeaders({ maxAge: 300 }, dummyRequest);
			assert.equal(headers.get('Vercel-CDN-Cache-Control'), 'public, max-age=300');
		});

		it('includes stale-while-revalidate', () => {
			const headers = provider.setHeaders({ maxAge: 300, swr: 60 }, dummyRequest);
			assert.equal(
				headers.get('Vercel-CDN-Cache-Control'),
				'public, max-age=300, stale-while-revalidate=60',
			);
		});

		it('sets public even without maxAge or swr', () => {
			const headers = provider.setHeaders({ tags: ['foo'] }, dummyRequest);
			assert.equal(headers.get('Vercel-CDN-Cache-Control'), 'public');
		});

		it('does not set CDN-Cache-Control (only Vercel-specific)', () => {
			const headers = provider.setHeaders({ maxAge: 300 }, dummyRequest);
			assert.equal(headers.get('CDN-Cache-Control'), null);
		});

		it('sets Vercel-Cache-Tag with user tags and path tag', () => {
			const headers = provider.setHeaders(
				{ maxAge: 60, tags: ['products', 'featured'] },
				dummyRequest,
			);
			const tagHeader = headers.get('Vercel-Cache-Tag');
			assert.ok(tagHeader.includes('products'));
			assert.ok(tagHeader.includes('featured'));
			assert.ok(tagHeader.includes('astro-path:/products/123'));
		});

		it('includes path tag even with no user tags', () => {
			const headers = provider.setHeaders({ maxAge: 60 }, dummyRequest);
			assert.equal(headers.get('Vercel-Cache-Tag'), 'astro-path:/products/123');
		});

		it('does not set generic Cache-Tag (only Vercel-specific)', () => {
			const headers = provider.setHeaders({ maxAge: 60, tags: ['foo'] }, dummyRequest);
			assert.equal(headers.get('Cache-Tag'), null);
		});

		it('sets Last-Modified header', () => {
			const date = new Date('2026-04-15T12:00:00Z');
			const headers = provider.setHeaders({ maxAge: 60, lastModified: date }, dummyRequest);
			assert.equal(headers.get('Last-Modified'), 'Wed, 15 Apr 2026 12:00:00 GMT');
		});

		it('sets ETag header', () => {
			const headers = provider.setHeaders({ maxAge: 60, etag: '"v1"' }, dummyRequest);
			assert.equal(headers.get('ETag'), '"v1"');
		});
	});

	describe('invalidate', () => {
		it('has the correct provider name', () => {
			assert.equal(provider.name, 'vercel');
		});
	});
});
