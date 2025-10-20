import * as assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import { NodeApp } from '../../../dist/core/app/node.js';

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

describe('NodeApp', () => {
	describe('createRequest', () => {
		describe('x-forwarded-for', () => {
			it('parses client IP from single-value x-forwarded-for header', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						'x-forwarded-for': '1.1.1.1',
					},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('parses client IP from multi-value x-forwarded-for header', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						'x-forwarded-for': '1.1.1.1,8.8.8.8',
					},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('parses client IP from multi-value x-forwarded-for header with spaces', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						'x-forwarded-for': ' 1.1.1.1, 8.8.8.8, 8.8.8.2',
					},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '1.1.1.1');
			});

			it('fallbacks to remoteAddress when no x-forwarded-for header is present', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {},
				});
				assert.equal(result[Symbol.for('astro.clientAddress')], '2.2.2.2');
			});
		});

		describe('x-forwarded-host', () => {
			it('parses host from single-value x-forwarded-host header', () => {
				const result = NodeApp.createRequest(
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
				const result = NodeApp.createRequest(
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
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
					},
				});
				assert.equal(result.url, 'https://example.com/');
			});

			it('bad values are ignored and fallback to host header', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
						'x-forwarded-host': ':123',
					},
				});
				assert.equal(result.url, 'https://example.com/');
			});
		});

		describe('x-forwarded-proto', () => {
			it('parses protocol from single-value x-forwarded-proto header', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
						'x-forwarded-proto': 'http',
						'x-forwarded-port': '80',
					},
				});
				assert.equal(result.url, 'http://example.com/');
			});

			it('parses protocol from multi-value x-forwarded-proto header', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
						'x-forwarded-proto': 'http,https',
						'x-forwarded-port': '80,443',
					},
				});
				assert.equal(result.url, 'http://example.com/');
			});

			it('fallbacks to encrypted property when no x-forwarded-proto header is present', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
					},
				});
				assert.equal(result.url, 'https://example.com/');
			});
		});

		describe('x-forwarded-port', () => {
			it('parses port from single-value x-forwarded-port header', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
						'x-forwarded-port': '8443',
					},
				});
				assert.equal(result.url, 'https://example.com:8443/');
			});

			it('parses port from multi-value x-forwarded-port header', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com',
						'x-forwarded-port': '8443,3000',
					},
				});
				assert.equal(result.url, 'https://example.com:8443/');
			});

			it('prefers port from host', () => {
				const result = NodeApp.createRequest({
					...mockNodeRequest,
					headers: {
						host: 'example.com:3000',
						'x-forwarded-port': '443',
					},
				});
				assert.equal(result.url, 'https://example.com:3000/');
			});

			it('prefers port from x-forwarded-host', () => {
				const result = NodeApp.createRequest(
					{
						...mockNodeRequest,
						headers: {
							host: 'example.com:443',
							'x-forwarded-host': 'example.com:3000',
							'x-forwarded-port': '443',
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
			const result = NodeApp.createRequest({
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
			const result = NodeApp.createRequest(nodeRequest);
			assert.equal(typeof result.signal.addEventListener, 'function');
			assert.equal(socket.listenerCount('close') > 0, true);

			const response = new Response('ok');
			const destination = new MockServerResponse(nodeRequest);
			await NodeApp.writeResponse(response, destination);

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
