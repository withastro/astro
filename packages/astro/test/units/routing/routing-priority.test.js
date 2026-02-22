import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { dynamicPart, makeRoute, spreadPart, staticPart } from './test-helpers.js';

const trailingSlash = 'ignore';

const routes = [
	makeRoute({
		segments: [],
		trailingSlash,
		route: '/',
		pathname: '/',
		isIndex: true,
		component: 'index.astro',
	}),
	makeRoute({
		segments: [[staticPart('de')]],
		trailingSlash,
		route: '/de',
		pathname: '/de',
		isIndex: true,
		component: 'de/index.astro',
	}),
	makeRoute({
		segments: [[dynamicPart('lang')]],
		trailingSlash,
		route: '/[lang]',
		pathname: undefined,
		isIndex: true,
		component: '[lang]/index.astro',
	}),
	makeRoute({
		segments: [[dynamicPart('lang')], [spreadPart('...catchall')]],
		trailingSlash,
		route: '/[lang]/[...catchall]',
		pathname: undefined,
		component: '[lang]/[...catchall].astro',
	}),
	makeRoute({
		segments: [[staticPart('posts')], [dynamicPart('pid')]],
		trailingSlash,
		route: '/posts/[pid]',
		pathname: undefined,
		component: 'posts/[pid].astro',
	}),
	makeRoute({
		segments: [[staticPart('posts')], [spreadPart('...slug')]],
		trailingSlash,
		route: '/posts/[...slug]',
		pathname: undefined,
		component: 'posts/[...slug].astro',
	}),
	makeRoute({
		segments: [[staticPart('injected')]],
		trailingSlash,
		route: '/injected',
		pathname: '/injected',
		component: 'to-inject.astro',
		origin: 'external',
	}),
	makeRoute({
		segments: [[staticPart('_injected')]],
		trailingSlash,
		route: '/_injected',
		pathname: '/_injected',
		component: 'to-inject.astro',
		origin: 'external',
	}),
	makeRoute({
		segments: [
			[staticPart('api')],
			[staticPart('catch')],
			[spreadPart('...slug'), staticPart('.json')],
		],
		trailingSlash,
		route: '/api/catch/[...slug].json',
		pathname: undefined,
		type: 'endpoint',
		component: 'api/catch/[...slug].json.ts',
	}),
	makeRoute({
		segments: [
			[staticPart('api')],
			[staticPart('catch')],
			[dynamicPart('foo'), staticPart('-'), dynamicPart('bar'), staticPart('.json')],
		],
		trailingSlash,
		route: '/api/catch/[foo]-[bar].json',
		pathname: undefined,
		type: 'endpoint',
		component: 'api/catch/[foo]-[bar].json.ts',
	}),
	makeRoute({
		segments: [[staticPart('empty-slug')], [spreadPart('...slug')]],
		trailingSlash,
		route: '/empty-slug/[...slug]',
		pathname: undefined,
		component: 'empty-slug/[...slug].astro',
	}),
];

describe('routing priority (unit)', () => {
	const router = new Router(routes, {
		base: '/',
		trailingSlash,
		buildFormat: 'directory',
	});

	it('matches / to index route', () => {
		const match = router.match('/');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'index.astro');
	});

	it('matches static locale route before dynamic', () => {
		const match = router.match('/de');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'de/index.astro');
	});

	it('matches dynamic locale route when static does not exist', () => {
		const match = router.match('/en');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, '[lang]/index.astro');
		assert.deepEqual(match.params, { lang: 'en' });
	});

	it('matches dynamic catchall under locale', () => {
		const match = router.match('/de/1/2');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, '[lang]/[...catchall].astro');
		assert.deepEqual(match.params, { lang: 'de', catchall: '1/2' });
	});

	it('matches posts/[pid] over posts/[...slug]', () => {
		const match = router.match('/posts/post-1');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'posts/[pid].astro');
		assert.deepEqual(match.params, { pid: 'post-1' });
	});

	it('matches posts/[...slug] for deeper paths', () => {
		const match = router.match('/posts/1/2');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'posts/[...slug].astro');
		assert.deepEqual(match.params, { slug: '1/2' });
	});

	it('matches injected static routes', () => {
		const injected = router.match('/injected');
		assert.equal(injected.type, 'match');
		assert.equal(injected.route.component, 'to-inject.astro');

		const underscored = router.match('/_injected');
		assert.equal(underscored.type, 'match');
		assert.equal(underscored.route.component, 'to-inject.astro');
	});

	it('matches endpoint catch-all JSON route', () => {
		const match = router.match('/api/catch/a.json');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'api/catch/[...slug].json.ts');
		assert.deepEqual(match.params, { slug: 'a' });
	});

	it('matches endpoint catch-all JSON route for nested paths', () => {
		const match = router.match('/api/catch/b/c.json');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'api/catch/[...slug].json.ts');
		assert.deepEqual(match.params, { slug: 'b/c' });
	});

	it('matches endpoint [foo]-[bar].json over catch-all', () => {
		const match = router.match('/api/catch/a-b.json');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'api/catch/[foo]-[bar].json.ts');
		assert.deepEqual(match.params, { foo: 'a', bar: 'b' });
	});

	it('matches empty spread params as undefined', () => {
		const match = router.match('/empty-slug');
		assert.equal(match.type, 'match');
		assert.equal(match.route.component, 'empty-slug/[...slug].astro');
		assert.deepEqual(match.params, { slug: undefined });
	});
});
