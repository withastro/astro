import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeImageServiceConfig } from '../dist/utils/image-config.js';

describe('normalizeImageServiceConfig', () => {
	it('defaults to cloudflare-binding when no config is provided', () => {
		const result = normalizeImageServiceConfig(undefined);
		assert.equal(result.buildService, 'cloudflare-binding');
		assert.equal(result.runtimeService, 'cloudflare-binding');
	});

	it('uses compile for both build and passthrough for runtime when compile is specified', () => {
		const result = normalizeImageServiceConfig('compile');
		assert.equal(result.buildService, 'compile');
		assert.equal(result.runtimeService, 'passthrough');
	});

	it('respects explicit cloudflare-binding', () => {
		const result = normalizeImageServiceConfig('cloudflare-binding');
		assert.equal(result.buildService, 'cloudflare-binding');
		assert.equal(result.runtimeService, 'cloudflare-binding');
	});

	it('handles compound config with compile build and cloudflare-binding runtime', () => {
		const result = normalizeImageServiceConfig({
			build: 'compile',
			runtime: 'cloudflare-binding',
		});
		assert.equal(result.buildService, 'compile');
		assert.equal(result.runtimeService, 'cloudflare-binding');
	});

	it('defaults compound config runtime to passthrough', () => {
		const result = normalizeImageServiceConfig({ build: 'compile' });
		assert.equal(result.buildService, 'compile');
		assert.equal(result.runtimeService, 'passthrough');
	});
});
