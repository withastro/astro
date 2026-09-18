import assert from 'node:assert/strict';
import http from 'node:http';
import { describe, it } from 'node:test';
import nodejs from '../../dist/index.js';
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
		const { server } = createServer(noopListener, 'localhost', 0, 65000);

		assert.equal(server.keepAliveTimeout, 65000);
	});

	// Node.js assigns any value to `keepAliveTimeout` without complaint, and every value
	// rejected here would silently disable the timeout instead of extending it.
	for (const value of [-1, Number.POSITIVE_INFINITY, Number.NaN]) {
		it(`rejects ${value}`, () => {
			assert.throws(
				() => nodejs({ mode: 'standalone', keepAliveTimeout: value }),
				/keepAliveTimeout/,
			);
		});
	}

	it('allows 0, which disables the timeout', () => {
		assert.doesNotThrow(() => nodejs({ mode: 'standalone', keepAliveTimeout: 0 }));
	});
});
