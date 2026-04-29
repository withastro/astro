import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	isRemoteRedirectAllowed,
	matchHostname,
	matchPattern,
	matchPathname,
	matchPort,
	matchProtocol,
} from '../dist/remote.js';

describe('isRemoteRedirectAllowed', () => {
	it('should return true when URL matches pattern with followRedirects enabled', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'example.com',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should return false when URL matches pattern with followRedirects disabled', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'example.com',
				followRedirects: false,
			},
		]);
		assert.equal(result, false);
	});

	it('should return false when URL matches pattern without followRedirects property', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'example.com',
			},
		]);
		assert.equal(result, false);
	});

	it('should return false when URL does not match any pattern', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'other.com',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});

	it('should return false for empty remotePatterns array', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', []);
		assert.equal(result, false);
	});

	it('should return false for invalid URL', () => {
		const result = isRemoteRedirectAllowed('not-a-valid-url', [
			{
				hostname: 'example.com',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});

	it('should return true when URL matches one pattern with followRedirects enabled and others disabled', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'other.com',
				followRedirects: true,
			},
			{
				hostname: 'example.com',
				followRedirects: true,
			},
			{
				hostname: 'another.com',
				followRedirects: false,
			},
		]);
		assert.equal(result, true);
	});

	it('should return false when URL matches only patterns with followRedirects disabled', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'example.com',
				followRedirects: false,
			},
			{
				hostname: 'example.com',
				pathname: '/images/*',
				followRedirects: false,
			},
		]);
		assert.equal(result, false);
	});

	it('should handle wildcard hostname patterns with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://cdn.example.com/image.jpg', [
			{
				hostname: '*.example.com',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should handle double wildcard hostname patterns with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://api.cdn.example.com/image.jpg', [
			{
				hostname: '**.example.com',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should handle pathname wildcards with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://example.com/images/photo.jpg', [
			{
				hostname: 'example.com',
				pathname: '/images/*',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should handle pathname double wildcards with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://example.com/api/v1/images/photo.jpg', [
			{
				hostname: 'example.com',
				pathname: '/api/**',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should respect protocol matching with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'example.com',
				protocol: 'http',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});

	it('should match correct protocol with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'example.com',
				protocol: 'https',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should respect port matching with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://example.com:8443/image.jpg', [
			{
				hostname: 'example.com',
				port: '443',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});

	it('should match correct port with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://example.com:8443/image.jpg', [
			{
				hostname: 'example.com',
				port: '8443',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should handle complex pattern matching with all constraints', () => {
		const result = isRemoteRedirectAllowed('https://cdn.example.com:8443/api/v1/images/photo.jpg', [
			{
				hostname: '*.example.com',
				pathname: '/api/**',
				protocol: 'https',
				port: '8443',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should return false for complex pattern when one constraint does not match', () => {
		const result = isRemoteRedirectAllowed('https://cdn.example.com:8443/api/v1/images/photo.jpg', [
			{
				hostname: '*.example.com',
				pathname: '/images/**', // Different pathname
				protocol: 'https',
				port: '8443',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});

	it('should return true for data URLs with pattern that has no constraints', () => {
		const result = isRemoteRedirectAllowed('data:image/png;base64,iVBORw0KGgo', [
			{
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should return false for data URLs with protocol constraint', () => {
		const result = isRemoteRedirectAllowed('data:image/png;base64,iVBORw0KGgo', [
			{
				protocol: 'https',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});

	it('should return true when first pattern does not match but second does', () => {
		const result = isRemoteRedirectAllowed('https://other.com/image.jpg', [
			{
				hostname: 'example.com',
				followRedirects: true,
			},
			{
				hostname: 'other.com',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should handle relative paths (even though they may not be valid URLs)', () => {
		const result = isRemoteRedirectAllowed('/image.jpg', [
			{
				pathname: '/image.jpg',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});

	it('should handle exact pathname matching with followRedirects', () => {
		const result = isRemoteRedirectAllowed('https://example.com/image.jpg', [
			{
				hostname: 'example.com',
				pathname: '/image.jpg',
				followRedirects: true,
			},
		]);
		assert.equal(result, true);
	});

	it('should not match pathname when pattern uses exact match but URL differs', () => {
		const result = isRemoteRedirectAllowed('https://example.com/other.jpg', [
			{
				hostname: 'example.com',
				pathname: '/image.jpg',
				followRedirects: true,
			},
		]);
		assert.equal(result, false);
	});
});

describe('matchProtocol', () => {
	it('should return true when protocol matches', () => {
		const url = new URL('https://example.com');
		assert.equal(matchProtocol(url, 'https'), true);
	});

	it('should return false when protocol does not match', () => {
		const url = new URL('https://example.com');
		assert.equal(matchProtocol(url, 'http'), false);
	});

	it('should return true when no protocol is specified', () => {
		const url = new URL('https://example.com');
		assert.equal(matchProtocol(url, undefined), true);
	});
});

describe('matchHostname', () => {
	it('should match exact hostname', () => {
		const url = new URL('https://example.com');
		assert.equal(matchHostname(url, 'example.com'), true);
	});

	it('should not match different hostname', () => {
		const url = new URL('https://example.com');
		assert.equal(matchHostname(url, 'other.com'), false);
	});

	it('should return true when no hostname is specified', () => {
		const url = new URL('https://example.com');
		assert.equal(matchHostname(url, undefined), true);
	});

	it('should match single wildcard subdomain', () => {
		const url = new URL('https://cdn.example.com');
		assert.equal(matchHostname(url, '*.example.com', true), true);
	});

	it('should not match multiple subdomains with single wildcard', () => {
		const url = new URL('https://api.cdn.example.com');
		assert.equal(matchHostname(url, '*.example.com', true), false);
	});

	it('should match multiple subdomains with double wildcard', () => {
		const url = new URL('https://api.cdn.example.com');
		assert.equal(matchHostname(url, '**.example.com', true), true);
	});

	it('should not match base domain with double wildcard', () => {
		const url = new URL('https://example.com');
		assert.equal(matchHostname(url, '**.example.com', true), false);
	});

	it('should not match wildcard when allowWildcard is false', () => {
		const url = new URL('https://cdn.example.com');
		assert.equal(matchHostname(url, '*.example.com', false), false);
	});
});

describe('matchPort', () => {
	it('should match when port matches', () => {
		const url = new URL('https://example.com:8443');
		assert.equal(matchPort(url, '8443'), true);
	});

	it('should not match when port differs', () => {
		const url = new URL('https://example.com:8443');
		assert.equal(matchPort(url, '443'), false);
	});

	it('should return true when no port is specified', () => {
		const url = new URL('https://example.com');
		assert.equal(matchPort(url, undefined), true);
	});

	it('should handle default https port', () => {
		const url = new URL('https://example.com');
		assert.equal(matchPort(url, '443'), false); // Default port is empty string in URL
	});
});

describe('matchPathname', () => {
	it('should match exact pathname', () => {
		const url = new URL('https://example.com/image.jpg');
		assert.equal(matchPathname(url, '/image.jpg'), true);
	});

	it('should not match different pathname', () => {
		const url = new URL('https://example.com/image.jpg');
		assert.equal(matchPathname(url, '/other.jpg'), false);
	});

	it('should return true when no pathname is specified', () => {
		const url = new URL('https://example.com/image.jpg');
		assert.equal(matchPathname(url, undefined), true);
	});

	it('should match single level wildcard', () => {
		const url = new URL('https://example.com/images/photo.jpg');
		assert.equal(matchPathname(url, '/images/*', true), true);
	});

	it('should not match multiple levels with single wildcard', () => {
		const url = new URL('https://example.com/images/2024/photo.jpg');
		assert.equal(matchPathname(url, '/images/*', true), false);
	});

	it('should match multiple levels with double wildcard', () => {
		const url = new URL('https://example.com/api/v1/images/photo.jpg');
		assert.equal(matchPathname(url, '/api/**', true), true);
	});

	it('should not match when wildcard pattern does not match', () => {
		const url = new URL('https://example.com/other/path.jpg');
		assert.equal(matchPathname(url, '/api/**', true), false);
	});

	it('should not match wildcard when allowWildcard is false', () => {
		const url = new URL('https://example.com/images/photo.jpg');
		assert.equal(matchPathname(url, '/images/*', false), false);
	});
});

describe('matchPattern', () => {
	it('should match when all pattern fields match', () => {
		const url = new URL('https://example.com:8443/api/images/photo.jpg');
		const pattern = {
			hostname: 'example.com',
			pathname: '/api/**',
			protocol: 'https',
			port: '8443',
		};
		assert.equal(matchPattern(url, pattern), true);
	});

	it('should not match when hostname does not match', () => {
		const url = new URL('https://example.com/api/images/photo.jpg');
		const pattern = {
			hostname: 'other.com',
			pathname: '/api/**',
			protocol: 'https',
		};
		assert.equal(matchPattern(url, pattern), false);
	});

	it('should not match when pathname does not match', () => {
		const url = new URL('https://example.com/images/photo.jpg');
		const pattern = {
			hostname: 'example.com',
			pathname: '/api/**',
			protocol: 'https',
		};
		assert.equal(matchPattern(url, pattern), false);
	});

	it('should not match when protocol does not match', () => {
		const url = new URL('https://example.com/api/images/photo.jpg');
		const pattern = {
			hostname: 'example.com',
			pathname: '/api/**',
			protocol: 'http',
		};
		assert.equal(matchPattern(url, pattern), false);
	});

	it('should not match when port does not match', () => {
		const url = new URL('https://example.com:8443/api/images/photo.jpg');
		const pattern = {
			hostname: 'example.com',
			pathname: '/api/**',
			protocol: 'https',
			port: '443',
		};
		assert.equal(matchPattern(url, pattern), false);
	});

	it('should match with empty pattern', () => {
		const url = new URL('https://example.com/api/images/photo.jpg');
		const pattern = {};
		assert.equal(matchPattern(url, pattern), true);
	});
});
