import assert from 'node:assert/strict';
import http from 'node:http';
import { describe, it } from 'node:test';
import { createServer } from '../../dist/standalone.js';

const noopListener: http.RequestListener = () => {};

describe('keepAliveTimeout', () => {
	it('keeps the Node.js default when the option is not set', () => {
		const { server } = createServer(noopListener, 'localhost', 0);

		// Compared against a freshly created server instead of a hardcoded number so the
		// test keeps passing when Node.js changes its own default.
		assert.equal(server.keepAliveTimeout, http.createServer().keepAliveTimeout);
	});

	it('applies the configured value to the underlying server', () => {
		const { server } = createServer(noopListener, 'localhost', 0, 65_000);

		assert.equal(server.keepAliveTimeout, 65_000);
	});
});
