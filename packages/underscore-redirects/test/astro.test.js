import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRedirectsFromAstroRoutes, getTrailingSlashPaths } from '../dist/index.js';

describe('Astro', () => {
	it('Creates a Redirects object from routes', () => {
		const routeToDynamicTargetMap = new Map(
			Array.from([
				[{ pattern: '/', pathname: '/', segments: [] }, './.adapter/dist/entry.mjs'],
				[{ pattern: '/one', pathname: '/one', segments: [] }, './.adapter/dist/entry.mjs'],
			]),
		);
		const _redirects = createRedirectsFromAstroRoutes({
			config: {
				build: { format: 'directory' },
			},
			routeToDynamicTargetMap,
			dir: new URL(import.meta.url),
			buildOutput: 'server',
			assets: new Map([
				['/', new URL('./index.html', import.meta.url)],
				['/one', new URL('./one/index.html', import.meta.url)],
			]),
		});

		assert.equal(_redirects.definitions.length, 2);
	});

	it('Generates correct paths for root', () => {
		assert.deepEqual(getTrailingSlashPaths('/', 'ignore'), ['/']);
		assert.deepEqual(getTrailingSlashPaths('/', 'always'), ['/']);
		assert.deepEqual(getTrailingSlashPaths('/', 'never'), ['/']);
	});

	it('Generates correct paths for trailingslash ignore', () => {
		assert.deepEqual(getTrailingSlashPaths('/path', 'ignore'), ['/path', '/path/']);
		assert.deepEqual(getTrailingSlashPaths('/path/', 'ignore'), ['/path', '/path/']);
	});

	it('Generates correct paths for trailingslash always', () => {
		assert.deepEqual(getTrailingSlashPaths('/path', 'always'), ['/path/']);
		assert.deepEqual(getTrailingSlashPaths('/path/', 'always'), ['/path/']);
	});

	it('Generates correct paths for trailingslash never', () => {
		assert.deepEqual(getTrailingSlashPaths('/path', 'never'), ['/path']);
		assert.deepEqual(getTrailingSlashPaths('/path/', 'never'), ['/path']);
	});
});
