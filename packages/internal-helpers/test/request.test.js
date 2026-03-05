import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getClientIpAddress,
	getFirstForwardedValue,
	getValidatedIpFromHeader,
	isValidIpAddress,
} from '../dist/request.js';

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

describe('isValidIpAddress', () => {
	const validAddresses = [
		// IPv4
		'127.0.0.1',
		'0.0.0.0',
		'255.255.255.255',
		'192.168.1.1',
		'10.0.0.1',
		'203.0.113.50',

		// IPv6
		'::1',
		'::',
		'2001:db8::1',
		'fe80::1',
		'::ffff:192.0.2.1',
		'2001:0db8:0000:0000:0000:0000:0000:0001',
		'fd12:3456:789a::1',
	];

	const invalidAddresses = [
		// Injection payloads
		'<script>alert(1)</script>',
		"'; DROP TABLE users; --",
		'../../etc/passwd',
		'<img src=x onerror=alert(1)>',

		// Arbitrary strings
		'not-an-ip',
		'hello world',
		'localhost',
		'example.com',

		// Empty / whitespace
		'',
		' ',

		// Oversized
		'1'.repeat(46),

		// Path-like
		'/home/user',
		'C:\\Windows',

		// URL-like
		'http://evil.com',
	];

	it('should accept valid IP addresses', () => {
		for (const addr of validAddresses) {
			assert.equal(isValidIpAddress(addr), true, `Expected "${addr}" to be valid`);
		}
	});

	it('should reject non-IP strings', () => {
		for (const addr of invalidAddresses) {
			assert.equal(isValidIpAddress(addr), false, `Expected "${addr}" to be invalid`);
		}
	});
});

describe('getValidatedIpFromHeader', () => {
	it('should return a valid IP from a single-value header', () => {
		assert.equal(getValidatedIpFromHeader('203.0.113.50'), '203.0.113.50');
	});

	it('should return the first valid IP from a multi-value header', () => {
		assert.equal(getValidatedIpFromHeader('203.0.113.50, 10.0.0.1'), '203.0.113.50');
	});

	it('should return undefined for non-IP header values', () => {
		assert.equal(getValidatedIpFromHeader('<script>alert(1)</script>'), undefined);
	});

	it('should return undefined for null', () => {
		assert.equal(getValidatedIpFromHeader(null), undefined);
	});

	it('should return undefined for undefined', () => {
		assert.equal(getValidatedIpFromHeader(undefined), undefined);
	});

	it('should return undefined for empty string', () => {
		assert.equal(getValidatedIpFromHeader(''), undefined);
	});

	it('should handle IPv6 addresses', () => {
		assert.equal(getValidatedIpFromHeader('2001:db8::1'), '2001:db8::1');
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
		const request = makeRequest({
			'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178',
		});
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

	it('should return undefined when x-forwarded-for header is empty', () => {
		const request = makeRequest({ 'x-forwarded-for': '' });
		assert.equal(getClientIpAddress(request), undefined);
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

	it('should return undefined for whitespace-only values', () => {
		const request = makeRequest({ 'x-forwarded-for': ' , ' });
		assert.equal(getClientIpAddress(request), undefined);
	});

	it('should not be affected by other headers', () => {
		const request = makeRequest({
			'x-real-ip': '10.0.0.1',
			forwarded: 'for=10.0.0.2',
		});
		assert.equal(getClientIpAddress(request), undefined);
	});

	it('should reject HTML injection in x-forwarded-for', () => {
		const request = makeRequest({ 'x-forwarded-for': '<script>alert(1)</script>' });
		assert.equal(getClientIpAddress(request), undefined);
	});

	it('should reject SQL injection in x-forwarded-for', () => {
		const request = makeRequest({ 'x-forwarded-for': "'; DROP TABLE users; --" });
		assert.equal(getClientIpAddress(request), undefined);
	});

	it('should reject path traversal in x-forwarded-for', () => {
		const request = makeRequest({ 'x-forwarded-for': '../../etc/passwd' });
		assert.equal(getClientIpAddress(request), undefined);
	});

	it('should reject oversized x-forwarded-for values', () => {
		const request = makeRequest({ 'x-forwarded-for': '1'.repeat(100) });
		assert.equal(getClientIpAddress(request), undefined);
	});
});
