import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isDefaultServerEntrypoint } from '../dist/utils/wrangler-config.js';

describe('isDefaultServerEntrypoint', () => {
	it('matches the default entrypoint resolved to a POSIX path', () => {
		assert.equal(
			isDefaultServerEntrypoint('/project/@astrojs/cloudflare/entrypoints/server'),
			true,
		);
	});

	it('matches the default entrypoint resolved to a Windows path', () => {
		assert.equal(
			isDefaultServerEntrypoint('C:\\project\\@astrojs\\cloudflare\\entrypoints\\server'),
			true,
		);
	});

	it('matches the default entrypoint with a .js extension', () => {
		assert.equal(
			isDefaultServerEntrypoint('/project/@astrojs/cloudflare/entrypoints/server.js'),
			true,
		);
		assert.equal(
			isDefaultServerEntrypoint('C:\\project\\@astrojs\\cloudflare\\entrypoints\\server.js'),
			true,
		);
	});

	it('does not match a custom entrypoint', () => {
		assert.equal(isDefaultServerEntrypoint('C:\\project\\src\\worker.ts'), false);
		assert.equal(isDefaultServerEntrypoint('/project/src/worker.ts'), false);
	});
});
