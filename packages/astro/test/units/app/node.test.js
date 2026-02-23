import * as assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import { createRequest, writeResponse } from '../../../dist/core/app/node.js';

const mockNodeRequest = {
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
				const result = createRequest({
					...mockNodeRequest,
					headers: {
						'x-forwarded-for': '1.1.1.1',
					},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('parses client IP from multi-value x-forwarded-for header', () => {
				const result = createRequest({
					...mockNodeRequest,
					headers: {
						'x-forwarded-for': '1.1.1.1,8.8.8.8',
					},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('parses client IP from multi-value x-forwarded-for header with spaces', () => {
				const result = createRequest({
					...mockNodeRequest,
					headers: {
						'x-forwarded-for': ' 1.1.1.1, 8.8.8.8, 8.8.8.2',
					},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('fallbacks to remoteAddress when no x-forwarded-for header is present', () => {
				const result = createRequest({
					...mockNodeRequest,
					headers: {},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '2.2.2.2');
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

			it('bad values are ignored and fallback to host header', () => {
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
				// localhost should not match *.victim.com, fallback to host header which does match
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

	describe('abort signal', () => {
		it('aborts the request.signal when the underlying socket closes', () => {
			const socket = new EventEmitter();
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
			const socket = new EventEmitter();
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
			const destination = new MockServerResponse(nodeRequest);
			await writeResponse(response, destination);

			assert.equal(result.signal.aborted, false);
			assert.equal(socket.listenerCount('close'), 0);
		});
	});
});

class MockServerResponse extends EventEmitter {
	constructor(req) {
		super();
		this.req = req;
		this.statusCode = 200;
		this.statusMessage = undefined;
		this.headers = {};
		this.body = [];
	}

	writeHead(status, headers) {
		this.statusCode = status;
		this.headers = headers;
	}

	write(chunk) {
		this.body.push(chunk);
		return true;
	}

	end() {
		this.emit('finish');
	}

	destroy() {
		this.emit('close');
	}
}
