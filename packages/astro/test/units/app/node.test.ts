import * as assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import { createRequest, writeResponse } from '../../../dist/core/app/node.js';

// Minimal mock satisfying the subset of IncomingMessage used by createRequest.
// We intentionally omit the full IncomingMessage interface members not exercised here.
const mockNodeRequest: any = {
	url: '/',
	method: 'GET',
	headers: {
		host: 'example.com',
	},
	socket: {
		encrypted: true,
		remoteAddress: '2.2.2.2',
	},
};

describe('node', () => {
	describe('createRequest', () => {
		describe('x-forwarded-for', () => {
			it('parses client IP from single-value x-forwarded-for header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-for': '1.1.1.1',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('parses client IP from multi-value x-forwarded-for header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-for': '1.1.1.1,8.8.8.8',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('parses client IP from multi-value x-forwarded-for header with spaces', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-for': ' 1.1.1.1, 8.8.8.8, 8.8.8.2',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('fallbacks to remoteAddress when no x-forwarded-for header is present', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});

			it('ignores x-forwarded-for when no allowedDomains is configured (default)', () => {
				const result = createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
						'x-forwarded-for': '1.1.1.1',
					},
				});
				// Without allowedDomains, x-forwarded-for should NOT be trusted
				// Falls back to socket remoteAddress
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});

			it('ignores x-forwarded-for when allowedDomains is empty', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-for': '1.1.1.1',
						},
					},
					{ allowedDomains: [] },
				);
				// Empty allowedDomains means no proxy trust, use socket address
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});

			it('trusts x-forwarded-for when host matches allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-for': '1.1.1.1',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				// Host matches allowedDomains, so x-forwarded-for is trusted
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('ignores x-forwarded-for when host does not match allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'attacker.com',
							'x-forwarded-for': '1.1.1.1',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				// Host does not match allowedDomains, so x-forwarded-for is NOT trusted
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});

			it('trusts x-forwarded-for when x-forwarded-host matches allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							'x-forwarded-host': 'example.com',
							'x-forwarded-for': '1.1.1.1',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				// X-Forwarded-Host validated against allowedDomains, so XFF is trusted
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('trusts multi-value x-forwarded-for when host matches allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-for': '1.1.1.1, 8.8.8.8',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('falls back to remoteAddress when host matches allowedDomains but no x-forwarded-for', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});

			it('prevents IP spoofing: attacker cannot override clientAddress without allowedDomains', () => {
				// Simulates an attacker injecting x-forwarded-for to spoof 127.0.0.1
				const result = createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
						'x-forwarded-for': '127.0.0.1',
					},
				});
				// Without allowedDomains, the spoofed IP must be ignored
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});

			it('prevents IP spoofing: attacker cannot override clientAddress when host does not match', () => {
				// Simulates attacker sending direct request with XFF and mismatched host
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'evil.com',
							'x-forwarded-for': '127.0.0.1',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				// Host doesn't match allowedDomains, so XFF is not trusted
				assert.equal((result as any)[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});
		});

		describe('x-forwarded-host', () => {
			it('parses host from single-value x-forwarded-host header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							'x-forwarded-host': 'www2.example.com',
						},
					},
					{ allowedDomains: [{ hostname: '**.example.com' }] },
				);
				assert.equal(result.url, 'https://www2.example.com/');
			});

			it('parses host from multi-value x-forwarded-host header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							'x-forwarded-host': 'www2.example.com,www3.example.com',
						},
					},
					{ allowedDomains: [{ hostname: '**.example.com' }] },
				);
				assert.equal(result.url, 'https://www2.example.com/');
			});

			it('fallbacks to host header when no x-forwarded-host header is present', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('bad values are ignored and fall back to host header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-host': ':123',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects empty x-forwarded-host and falls back to host header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'legitimate.example.com',
							'x-forwarded-host': '',
						},
					},
					{ allowedDomains: [{ hostname: '**.example.com' }] },
				);
				assert.equal(result.url, 'https://legitimate.example.com/');
			});

			it('rejects x-forwarded-host with no dots (e.g. localhost) against single wildcard pattern', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'sub.victim.com',
							'x-forwarded-host': 'localhost',
						},
					},
					{ allowedDomains: [{ hostname: '*.victim.com' }] },
				);
				// localhost should not match *.victim.com, fall back to host header which does match
				assert.equal(result.url, 'https://sub.victim.com/');
			});

			it('rejects x-forwarded-host with path separator (path injection attempt)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-host': 'example.com/admin',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com', protocol: 'https' }] },
				);
				// Path separator in host is rejected, falls back to Host header
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects x-forwarded-host with multiple path segments', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-host': 'example.com/admin/users',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com', protocol: 'https' }] },
				);
				// Path separators in host are rejected, falls back to Host header
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects x-forwarded-host with backslash path separator (path injection attempt)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-host': 'example.com\\admin',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com', protocol: 'https' }] },
				);
				// Backslash separator in host is rejected, falls back to Host header
				assert.equal(result.url, 'https://example.com/');
			});

			it('parses x-forwarded-host with embedded port when allowedDomains has port pattern', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-host': 'example.com:3000',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com', port: '3000' }] },
				);
				// X-Forwarded-Host with port should match pattern that includes port
				assert.equal(result.url, 'https://example.com:3000/');
			});
		});

		it('rejects Host header with path separator (path injection attempt)', () => {
			const result = createRequest({
				...mockNodeRequest,
				headers: {
					host: 'example.com/admin',
				},
			});
			// Host header with path is rejected, falls back to localhost
			assert.equal(result.url, 'https://localhost/');
		});

		it('rejects Host header with backslash path separator (path injection attempt)', () => {
			const result = createRequest({
				...mockNodeRequest,
				headers: {
					host: 'example.com\\admin',
				},
			});
			// Host header with backslash is rejected, falls back to localhost
			assert.equal(result.url, 'https://localhost/');
		});

		describe('Host header validation', () => {
			it('rejects Host header when allowedDomains is configured but host does not match', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'attacker.com',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				// Host header doesn't match allowedDomains, falls back to localhost
				assert.equal(result.url, 'https://localhost/');
			});

			it('accepts Host header when it matches allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('accepts Host header with port when it matches allowedDomains pattern', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com:3000',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com', port: '3000' }] },
				);
				assert.equal(result.url, 'https://example.com:3000/');
			});

			it('accepts Host header with wildcard pattern in allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'sub.example.com',
						},
					},
					{ allowedDomains: [{ hostname: '**.example.com' }] },
				);
				assert.equal(result.url, 'https://sub.example.com/');
			});

			it('falls back to localhost when no allowedDomains is configured', () => {
				const result = createRequest({
					...mockNodeRequest,
					headers: {
						host: 'any-host.com',
					},
				});
				// Without allowedDomains, Host header is not trusted, falls back to localhost
				assert.equal(result.url, 'https://localhost/');
			});

			it('falls back to localhost when allowedDomains is empty', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'any-host.com',
						},
					},
					{ allowedDomains: [] },
				);
				// Empty allowedDomains means Host header is not trusted
				assert.equal(result.url, 'https://localhost/');
			});

			it('includes server port in localhost fallback when port option is provided', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'anything.com',
						},
					},
					{ port: 4321 },
				);
				// The server port should be included so that
				// url.origin is http://localhost:4321, not http://localhost
				const url = new URL(result.url);
				assert.equal(url.hostname, 'localhost');
				assert.equal(url.port, '4321');
				assert.equal(url.origin, 'http://localhost:4321');
			});

			it('includes server port in localhost fallback when allowedDomains is empty', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'anything.com',
						},
					},
					{ allowedDomains: [], port: 4321 },
				);
				assert.equal(new URL(result.url).origin, 'http://localhost:4321');
			});

			it('does not use server port when host is validated via allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'example.com',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }], port: 4321 },
				);
				// When the host is validated, the server port should NOT be appended
				assert.equal(result.url, 'http://example.com/');
			});

			it('omits default port 80 for http when server port is 80', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'anything.com',
						},
					},
					{ port: 80 },
				);
				// Port 80 is the default for http, so URL normalizes it away
				assert.equal(new URL(result.url).origin, 'http://localhost');
			});

			it('omits default port 443 for https when server port is 443', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: true, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'anything.com',
						},
					},
					{ port: 443 },
				);
				// Port 443 is the default for https, so URL normalizes it away
				assert.equal(new URL(result.url).origin, 'https://localhost');
			});

			it('does not include port when no port option is provided', () => {
				const result = createRequest({
					...mockNodeRequest,
					socket: { encrypted: false, remoteAddress: '2.2.2.2' },
					headers: {
						host: 'anything.com',
					},
				});
				// Without port option, falls back to localhost with no port
				assert.equal(new URL(result.url).origin, 'http://localhost');
			});

			it('prefers x-forwarded-host over Host header when both match allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-host': 'forwarded.example.com',
						},
					},
					{ allowedDomains: [{ hostname: '**.example.com' }] },
				);
				assert.equal(result.url, 'https://forwarded.example.com/');
			});
		});

		describe('x-forwarded-proto', () => {
			it('parses protocol from single-value x-forwarded-proto header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-proto': 'http',
							'x-forwarded-port': '80',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'http://example.com/');
			});

			it('parses protocol from multi-value x-forwarded-proto header', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-proto': 'http,https',
							'x-forwarded-port': '80,443',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'http://example.com/');
			});

			it('fallbacks to encrypted property when no x-forwarded-proto header is present', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects malicious x-forwarded-proto with URL injection (https://www.malicious-url.com/?tank=)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-proto': 'https://www.malicious-url.com/?tank=',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects malicious x-forwarded-proto with middleware bypass attempt (x:admin?)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-proto': 'x:admin?',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects malicious x-forwarded-proto with cache poison attempt (https://localhost/vulnerable?)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-proto': 'https://localhost/vulnerable?',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects malicious x-forwarded-proto with XSS attempt (javascript:alert(document.cookie)//)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-proto': 'javascript:alert(document.cookie)//',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('rejects x-forwarded-proto when no allowedDomains is configured', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'localhost:4321',
							'x-forwarded-proto': 'https',
						},
					},
					{ port: 4321 },
				);
				// Without allowedDomains, x-forwarded-proto should NOT be trusted
				// Falls back to socket.encrypted (false → http)
				const url = new URL(result.url);
				assert.equal(url.protocol, 'http:');
				assert.equal(url.origin, 'http://localhost:4321');
			});

			it('rejects x-forwarded-proto when allowedDomains is empty', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'localhost:4321',
							'x-forwarded-proto': 'https',
						},
					},
					{ allowedDomains: [], port: 4321 },
				);
				// Empty allowedDomains means x-forwarded-proto is not trusted
				const url = new URL(result.url);
				assert.equal(url.protocol, 'http:');
				assert.equal(url.origin, 'http://localhost:4321');
			});

			it('rejects empty x-forwarded-proto and falls back to encrypted property', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-proto': '',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('accepts x-forwarded-proto when allowedDomains has protocol and hostname', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'myapp.example.com',
							'x-forwarded-proto': 'https',
						},
					},
					{ allowedDomains: [{ protocol: 'https', hostname: 'myapp.example.com' }] },
				);
				// Without the fix, protocol validation fails due to hostname mismatch
				// and falls back to socket.encrypted (false → http)
				assert.equal(result.url, 'https://myapp.example.com/');
			});

			it('rejects x-forwarded-proto when it does not match protocol in allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'myapp.example.com',
							'x-forwarded-proto': 'http',
						},
					},
					{ allowedDomains: [{ protocol: 'https', hostname: 'myapp.example.com' }] },
				);
				// http is not in allowedDomains (only https), protocol falls back to socket (false → http)
				// Host validation also fails because http doesn't match the pattern's protocol: 'https'
				assert.equal(result.url, 'http://localhost/');
			});

			it('accepts x-forwarded-proto with wildcard hostname pattern in allowedDomains', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'myapp.example.com',
							'x-forwarded-proto': 'https',
						},
					},
					{ allowedDomains: [{ protocol: 'https', hostname: '**.example.com' }] },
				);
				assert.equal(result.url, 'https://myapp.example.com/');
			});

			it('constructs correct URL behind reverse proxy with all forwarded headers', () => {
				// Simulates: Reverse proxy terminates TLS, connects to Astro via HTTP,
				// forwards original protocol/host/port via X-Forwarded-* headers
				const result = createRequest(
					{
						...mockNodeRequest,
						socket: { encrypted: false, remoteAddress: '2.2.2.2' },
						headers: {
							host: 'myapp.example.com',
							'x-forwarded-proto': 'https',
							'x-forwarded-host': 'myapp.example.com',
						},
					},
					{ allowedDomains: [{ protocol: 'https', hostname: 'myapp.example.com' }] },
				);
				assert.equal(result.url, 'https://myapp.example.com/');
			});
		});

		describe('x-forwarded-port', () => {
			it('parses port from single-value x-forwarded-port header (with allowedDomains)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-port': '8443',
						},
					},
					{
						allowedDomains: [
							{ hostname: 'example.com' },
							{ hostname: 'example.com', port: '8443' },
						],
					},
				);
				assert.equal(result.url, 'https://example.com:8443/');
			});

			it('parses port from multi-value x-forwarded-port header (with allowedDomains)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-port': '8443,3000',
						},
					},
					{
						allowedDomains: [
							{ hostname: 'example.com' },
							{ hostname: 'example.com', port: '8443' },
						],
					},
				);
				assert.equal(result.url, 'https://example.com:8443/');
			});

			it('rejects x-forwarded-port without allowedDomains patterns (strict security default)', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-port': '8443',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com/');
			});

			it('prefers port from host', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com:3000',
							'x-forwarded-port': '443',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com', port: '3000' }] },
				);
				assert.equal(result.url, 'https://example.com:3000/');
			});

			it('uses port embedded in x-forwarded-host', () => {
				const result = createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com',
							'x-forwarded-host': 'example.com:3000',
						},
					},
					{ allowedDomains: [{ hostname: 'example.com' }] },
				);
				assert.equal(result.url, 'https://example.com:3000/');
			});
		});
	});

	describe('body size limit', () => {
		it('rejects request body that exceeds the configured bodySizeLimit', async () => {
			const { Readable } = await import('node:stream');
			// Create a stream that produces data exceeding the limit
			const limit = 1024; // 1KB limit
			const chunks: Buffer[] = [];
			// Create 2KB of data (exceeds 1KB limit)
			for (let i = 0; i < 4; i++) {
				chunks.push(Buffer.alloc(512, 0x41));
			}
			const stream = Readable.from(chunks);
			const req = {
				...mockNodeRequest,
				method: 'POST',
				headers: {
					...mockNodeRequest.headers,
					'content-type': 'application/octet-stream',
				},
				socket: mockNodeRequest.socket,
				[Symbol.asyncIterator]: stream[Symbol.asyncIterator].bind(stream),
			};

			const request = createRequest(req, { bodySizeLimit: limit });

			// The request should be created, but reading the body should fail
			await assert.rejects(
				async () => {
					const reader = request.body!.getReader();
					while (true) {
						const { done } = await reader.read();
						if (done) break;
					}
				},
				(err: Error) => {
					assert.ok(err.message.includes('Body size limit exceeded'));
					return true;
				},
			);
		});

		it('allows request body within the configured bodySizeLimit', async () => {
			const { Readable } = await import('node:stream');
			const limit = 2048; // 2KB limit
			const data = Buffer.alloc(1024, 0x42); // 1KB of data (within limit)
			const stream = Readable.from([data]);
			const req = {
				...mockNodeRequest,
				method: 'POST',
				headers: {
					...mockNodeRequest.headers,
					'content-type': 'application/octet-stream',
				},
				socket: mockNodeRequest.socket,
				[Symbol.asyncIterator]: stream[Symbol.asyncIterator].bind(stream),
			};

			const request = createRequest(req, { bodySizeLimit: limit });

			// Reading the body should succeed
			const reader = request.body!.getReader();
			const readChunks: Uint8Array[] = [];
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				readChunks.push(value);
			}
			const totalSize = readChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
			assert.equal(totalSize, 1024);
		});

		it('does not enforce body size limit when bodySizeLimit is not set', async () => {
			const { Readable } = await import('node:stream');
			// Create 2KB of data with no limit configured
			const data = Buffer.alloc(2048, 0x43);
			const stream = Readable.from([data]);
			const req = {
				...mockNodeRequest,
				method: 'POST',
				headers: {
					...mockNodeRequest.headers,
					'content-type': 'application/octet-stream',
				},
				socket: mockNodeRequest.socket,
				[Symbol.asyncIterator]: stream[Symbol.asyncIterator].bind(stream),
			};

			const request = createRequest(req);

			// Reading the body should succeed without limit
			const reader = request.body!.getReader();
			const readChunks: Uint8Array[] = [];
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				readChunks.push(value);
			}
			const totalSize = readChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
			assert.equal(totalSize, 2048);
		});
	});

	describe('abort signal', () => {
		it('aborts the request.signal when the underlying socket closes', () => {
			const socket: any = new EventEmitter();
			socket.encrypted = true;
			socket.remoteAddress = '2.2.2.2';
			socket.destroyed = false;
			const result = createRequest({
				...mockNodeRequest,
				socket,
			});
			assert.equal(result.signal.aborted, false);
			socket.destroyed = true;
			socket.emit('close');
			assert.equal(result.signal.aborted, true);
		});

		it('cleans up socket listeners after the response finishes', async () => {
			const socket: any = new EventEmitter();
			socket.encrypted = true;
			socket.remoteAddress = '2.2.2.2';
			socket.destroyed = false;
			const nodeRequest = {
				...mockNodeRequest,
				socket,
			};
			const result = createRequest(nodeRequest);
			assert.equal(typeof result.signal.addEventListener, 'function');
			assert.equal(socket.listenerCount('close') > 0, true);

			const response = new Response('ok');
			const destination = new MockServerResponse(nodeRequest) as any;
			await writeResponse(response, destination);

			assert.equal(result.signal.aborted, false);
			assert.equal(socket.listenerCount('close'), 0);
		});
	});
});

class MockServerResponse extends EventEmitter {
	req: any;
	statusCode: number;
	statusMessage: string | undefined;
	headers: Record<string, string>;
	body: unknown[];

	constructor(req: any) {
		super();
		this.req = req;
		this.statusCode = 200;
		this.statusMessage = undefined;
		this.headers = {};
		this.body = [];
	}

	writeHead(status: number, headers: Record<string, string>): void {
		this.statusCode = status;
		this.headers = headers;
	}

	write(chunk: unknown): boolean {
		this.body.push(chunk);
		return true;
	}

	end(): void {
		this.emit('finish');
	}

	destroy(): void {
		this.emit('close');
	}
}
