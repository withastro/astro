import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeImageServiceConfig } from '../../dist/utils/image-config.js';

describe('normalizeImageServiceConfig', () => {
	it('defaults to compile for static output', () => {
		const result = normalizeImageServiceConfig(undefined, 'static');
		assert.equal(result.buildService, 'compile');
		assert.equal(result.runtimeService, 'passthrough');
	});

	it('defaults to cloudflare-binding for server output', () => {
		const result = normalizeImageServiceConfig(undefined, 'server');
		assert.equal(result.buildService, 'cloudflare-binding');
		assert.equal(result.runtimeService, 'cloudflare-binding');
	});

	it('defaults to cloudflare-binding when output is not specified', () => {
		const result = normalizeImageServiceConfig(undefined, undefined);
		assert.equal(result.buildService, 'cloudflare-binding');
		assert.equal(result.runtimeService, 'cloudflare-binding');
	});

	it('respects explicit cloudflare-binding even with static output', () => {
		const result = normalizeImageServiceConfig('cloudflare-binding', 'static');
		assert.equal(result.buildService, 'cloudflare-binding');
		assert.equal(result.runtimeService, 'cloudflare-binding');
	});

	it('respects explicit compile with server output', () => {
		const result = normalizeImageServiceConfig('compile', 'server');
		assert.equal(result.buildService, 'compile');
		assert.equal(result.runtimeService, 'passthrough');
	});

	it('respects explicit passthrough regardless of output', () => {
		const result = normalizeImageServiceConfig('passthrough', 'static');
		assert.equal(result.buildService, 'passthrough');
		assert.equal(result.runtimeService, 'passthrough');
	});

	it('handles compound config regardless of output', () => {
		const result = normalizeImageServiceConfig(
			{ build: 'compile', runtime: 'cloudflare-binding' },
			'static',
		);
		assert.equal(result.buildService, 'compile');
		assert.equal(result.runtimeService, 'cloudflare-binding');
	});
});
