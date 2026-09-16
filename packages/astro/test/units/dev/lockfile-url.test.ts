import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveLockFileUrl } from '../../../dist/cli/dev/index.js';

describe('resolveLockFileUrl', () => {
	it('uses the local URL when one is available', () => {
		assert.equal(
			resolveLockFileUrl({ local: ['http://localhost:4321/'], network: [] }),
			'http://localhost:4321',
		);
	});

	it('prefers the local URL over the network URL', () => {
		assert.equal(
			resolveLockFileUrl({
				local: ['http://localhost:4321/'],
				network: ['http://192.168.1.50:4321/'],
			}),
			'http://localhost:4321',
		);
	});

	// `--host <non-loopback-address>`: Vite reports the URL under `network` and leaves `local`
	// empty, which used to crash with `Invalid URL` after the server had already started.
	it('falls back to the network URL when there is no local URL', () => {
		assert.equal(
			resolveLockFileUrl({ local: [], network: ['http://192.168.1.50:4321/'] }),
			'http://192.168.1.50:4321',
		);
	});

	it('preserves a non-default protocol', () => {
		assert.equal(
			resolveLockFileUrl({ local: [], network: ['https://192.168.1.50:4321/'] }),
			'https://192.168.1.50:4321',
		);
	});

	it('returns null when the server exposed no URL at all', () => {
		assert.equal(resolveLockFileUrl({ local: [], network: [] }), null);
	});

	it('returns null instead of throwing on an unparseable URL', () => {
		assert.equal(resolveLockFileUrl({ local: ['not a url'], network: [] }), null);
	});
});
