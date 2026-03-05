import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getClientIpAddress, getFirstForwardedValue } from '../dist/request.js';

describe('getFirstForwardedValue', () => {
	it('should return the first value from a comma-separated string', () => {
		assert.equal(getFirstForwardedValue('a, b, c'), 'a');
	});

	it('should return the only value when there is a single value', () => {
		assert.equal(getFirstForwardedValue('203.0.113.50'), '203.0.113.50');
	});

	it('should trim whitespace from the returned value', () => {
		assert.equal(getFirstForwardedValue('  203.0.113.50  ,  10.0.0.1  '), '203.0.113.50');
	});

	it('should return undefined for undefined input', () => {
		assert.equal(getFirstForwardedValue(undefined), undefined);
	});

	it('should return undefined for null input', () => {
		assert.equal(getFirstForwardedValue(null), undefined);
	});

	it('should handle an empty string', () => {
		assert.equal(getFirstForwardedValue(''), '');
	});

	it('should handle a string array by joining and splitting', () => {
		// .toString() on a string array produces "a,b", then split(',') works
		assert.equal(getFirstForwardedValue(['203.0.113.50', '10.0.0.1']), '203.0.113.50');
	});

	it('should handle an IPv6 address', () => {
		assert.equal(getFirstForwardedValue('2001:db8::1'), '2001:db8::1');
	});
});

describe('getClientIpAddress', () => {
	/**
	 * Helper to create a minimal Request with given headers.
	 */
	function makeRequest(headers = {}) {
		return new Request('https://example.com', { headers });
	}

	it('should return the IP when x-forwarded-for contains a single address', () => {
		const request = makeRequest({ 'x-forwarded-for': '203.0.113.50' });
		assert.equal(getClientIpAddress(request), '203.0.113.50');
	});

	it('should return the first IP when x-forwarded-for contains multiple addresses', () => {
		const request = makeRequest({ 'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178' });
		assert.equal(getClientIpAddress(request), '203.0.113.50');
	});

	it('should trim whitespace around addresses', () => {
		const request = makeRequest({ 'x-forwarded-for': '  203.0.113.50  ,  70.41.3.18  ' });
		assert.equal(getClientIpAddress(request), '203.0.113.50');
	});

	it('should return undefined when x-forwarded-for header is absent', () => {
		const request = makeRequest();
		assert.equal(getClientIpAddress(request), undefined);
	});

	it('should return an empty string when x-forwarded-for header is empty', () => {
		const request = makeRequest({ 'x-forwarded-for': '' });
		assert.equal(getClientIpAddress(request), '');
	});

	it('should handle an IPv6 address', () => {
		const request = makeRequest({ 'x-forwarded-for': '2001:db8::1' });
		assert.equal(getClientIpAddress(request), '2001:db8::1');
	});

	it('should return the first IPv6 address from a mixed list', () => {
		const request = makeRequest({ 'x-forwarded-for': '2001:db8::1, 203.0.113.50' });
		assert.equal(getClientIpAddress(request), '2001:db8::1');
	});

	it('should handle IPv4-mapped IPv6 address', () => {
		const request = makeRequest({ 'x-forwarded-for': '::ffff:192.0.2.1' });
		assert.equal(getClientIpAddress(request), '::ffff:192.0.2.1');
	});

	it('should handle the loopback address', () => {
		const request = makeRequest({ 'x-forwarded-for': '127.0.0.1' });
		assert.equal(getClientIpAddress(request), '127.0.0.1');
	});

	it('should handle a single comma with whitespace only values', () => {
		const request = makeRequest({ 'x-forwarded-for': ' , ' });
		assert.equal(getClientIpAddress(request), '');
	});

	it('should not be affected by other headers', () => {
		const request = makeRequest({
			'x-real-ip': '10.0.0.1',
			forwarded: 'for=10.0.0.2',
		});
		assert.equal(getClientIpAddress(request), undefined);
	});
});
