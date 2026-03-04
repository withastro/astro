import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createServer } from '../../dist/standalone.js';

describe('standalone server hardening', () => {
	it('sets requestTimeout on the HTTP server', () => {
		const listener = (_req, res) => {
			res.end('ok');
		};
		const server = createServer(listener, 'localhost', 0);
		try {
			assert.ok(
				server.server.requestTimeout > 0,
				`Expected requestTimeout > 0, got ${server.server.requestTimeout}`,
			);
			// Should be reasonable (not the Node.js default of 300000ms)
			assert.ok(
				server.server.requestTimeout <= 120000,
				`Expected requestTimeout <= 120000ms, got ${server.server.requestTimeout}`,
			);
		} finally {
			server.server.close();
		}
	});

	it('sets headersTimeout on the HTTP server', () => {
		const listener = (_req, res) => {
			res.end('ok');
		};
		const server = createServer(listener, 'localhost', 0);
		try {
			assert.ok(
				server.server.headersTimeout > 0,
				`Expected headersTimeout > 0, got ${server.server.headersTimeout}`,
			);
			assert.ok(
				server.server.headersTimeout <= 60000,
				`Expected headersTimeout <= 60000ms, got ${server.server.headersTimeout}`,
			);
		} finally {
			server.server.close();
		}
	});

	it('sets keepAliveTimeout on the HTTP server', () => {
		const listener = (_req, res) => {
			res.end('ok');
		};
		const server = createServer(listener, 'localhost', 0);
		try {
			assert.ok(
				server.server.keepAliveTimeout > 0,
				`Expected keepAliveTimeout > 0, got ${server.server.keepAliveTimeout}`,
			);
		} finally {
			server.server.close();
		}
	});
});
