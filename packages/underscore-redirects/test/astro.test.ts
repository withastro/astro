import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRedirectsFromAstroRoutes, getTrailingSlashPaths } from '../dist/index.js';
import type { AstroConfig, IntegrationResolvedRoute } from 'astro';

describe('Astro', () => {
	it('Creates a Redirects object from routes', () => {
		const routeToDynamicTargetMap = new Map<IntegrationResolvedRoute, string>(
			Array.from([
				[createIntegrationRoute('/'), './.adapter/dist/entry.mjs'],
				[createIntegrationRoute('/one'), './.adapter/dist/entry.mjs'],
			]),
		);

		const redirects = createRedirectsFromAstroRoutes({
			config: {
				build: { format: 'directory' },
			} as AstroConfig,
			routeToDynamicTargetMap,
			dir: new URL(import.meta.url),
			buildOutput: 'server',
			assets: new Map([
				['/', [new URL('./index.html', import.meta.url)]],
				['/one', [new URL('./one/index.html', import.meta.url)]],
			]),
		});

		assert.equal(redirects.definitions.length, 2);
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

function createIntegrationRoute(pattern: string, pathname = pattern): IntegrationResolvedRoute {
	const route: Partial<IntegrationResolvedRoute> = {
		pattern,
		pathname,
		segments: [],
	};
	return route as IntegrationResolvedRoute;
}
