import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyCloudflareResponseHeaders } from '../dist/utils/response.js';

describe('Cloudflare response headers', () => {
	it('mutates a mutable response in place', () => {
		const response = new Response('body');

		const result = applyCloudflareResponseHeaders(response, ['session=one'], true);

		assert.equal(result, response);
		assert.equal(response.headers.get('set-cookie'), 'session=one');
		assert.equal(response.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
	});

	it('rebuilds a response with immutable headers', () => {
		const response = Response.redirect('https://example.com/');

		const result = applyCloudflareResponseHeaders(response, ['session=one'], true);

		assert.notEqual(result, response);
		assert.equal(result.status, 302);
		assert.equal(result.headers.get('set-cookie'), 'session=one');
		assert.equal(result.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
	});
});
