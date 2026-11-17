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
	it('Dynamic redirect honours configured status', () => {
		const route = {
			pattern: '/old/[id]',
			pathname: undefined,
			segments: [
				[{ content: 'old', dynamic: false, spread: false }],
				[{ content: 'id', dynamic: true, spread: false }],
			],
			type: 'redirect',
			redirect: { destination: '/new/:id', status: 302 },
			redirectRoute: {
				pattern: '/new/[id]',
				segments: [
					[{ content: 'new', dynamic: false, spread: false }],
					[{ content: 'id', dynamic: true, spread: false }],
				],
			},
			entrypoint: '/old/[id]',
			isPrerendered: true,
			origin: 'internal',
		} as unknown as IntegrationResolvedRoute;

		const redirects = createRedirectsFromAstroRoutes({
			config: {
				build: { format: 'directory' },
				trailingSlash: 'never',
			} as AstroConfig,
			routeToDynamicTargetMap: new Map([[route, '']]),
			dir: new URL(import.meta.url),
			buildOutput: 'server',
			assets: new Map([['/old/[id]', [new URL('./old/index.html', import.meta.url)]]]),
		});

		assert.equal(redirects.definitions[0].status, 302);
	});

	it('Dynamic redirect defaults to 301 when redirect is a string', () => {
		const route = {
			pattern: '/old/[id]',
			pathname: undefined,
			segments: [
				[{ content: 'old', dynamic: false, spread: false }],
				[{ content: 'id', dynamic: true, spread: false }],
			],
			type: 'redirect',
			redirect: '/new/:id',
			redirectRoute: {
				pattern: '/new/[id]',
				segments: [
					[{ content: 'new', dynamic: false, spread: false }],
					[{ content: 'id', dynamic: true, spread: false }],
				],
			},
			entrypoint: '/old/[id]',
			isPrerendered: true,
			origin: 'internal',
		} as unknown as IntegrationResolvedRoute;

		const redirects = createRedirectsFromAstroRoutes({
			config: {
				build: { format: 'directory' },
				trailingSlash: 'never',
			} as AstroConfig,
			routeToDynamicTargetMap: new Map([[route, '']]),
			dir: new URL(import.meta.url),
			buildOutput: 'server',
			assets: new Map([['/old/[id]', [new URL('./old/index.html', import.meta.url)]]]),
		});

		assert.equal(redirects.definitions[0].status, 301);
	});

	it('Dynamic redirect targets use :splat for rest params without an HTML suffix', () => {
		const route = {
			pattern: '/blog/[...slug]',
			pathname: undefined,
			segments: [
				[{ content: 'blog', dynamic: false, spread: false }],
				[{ content: '...slug', dynamic: true, spread: true }],
			],
			type: 'redirect',
			redirect: '/articles/[...slug]',
			redirectRoute: {
				pattern: '/articles/[...slug]',
				segments: [
					[{ content: 'articles', dynamic: false, spread: false }],
					[{ content: '...slug', dynamic: true, spread: true }],
				],
			},
			entrypoint: '/blog/[...slug]',
			isPrerendered: true,
			origin: 'internal',
		} as unknown as IntegrationResolvedRoute;

		for (const format of ['directory', 'file'] as const) {
			const redirects = createRedirectsFromAstroRoutes({
				config: { build: { format } } as AstroConfig,
				routeToDynamicTargetMap: new Map([[route, '']]),
				dir: new URL(import.meta.url),
				buildOutput: 'static',
				assets: new Map([['/blog/[...slug]', [new URL('./articles/index.html', import.meta.url)]]]),
			});

			assert.equal(redirects.definitions[0].input, '/blog/*');
			assert.equal(redirects.definitions[0].target, '/articles/:splat');
		}
	});

	it('Dynamic redirect targets keep named params without an HTML suffix', () => {
		const route = {
			pattern: '/old/[id]',
			pathname: undefined,
			segments: [
				[{ content: 'old', dynamic: false, spread: false }],
				[{ content: 'id', dynamic: true, spread: false }],
			],
			type: 'redirect',
			redirect: '/new/[id]',
			redirectRoute: {
				pattern: '/new/[id]',
				segments: [
					[{ content: 'new', dynamic: false, spread: false }],
					[{ content: 'id', dynamic: true, spread: false }],
				],
			},
			entrypoint: '/old/[id]',
			isPrerendered: true,
			origin: 'internal',
		} as unknown as IntegrationResolvedRoute;

		const redirects = createRedirectsFromAstroRoutes({
			config: { build: { format: 'directory' } } as AstroConfig,
			routeToDynamicTargetMap: new Map([[route, '']]),
			dir: new URL(import.meta.url),
			buildOutput: 'static',
			assets: new Map([['/old/[id]', [new URL('./old/index.html', import.meta.url)]]]),
		});

		assert.equal(redirects.definitions[0].target, '/new/:id');
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
