import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig } from '../../../dist/types/public/config.js';
import type { RoutePart } from '../../../dist/types/public/internal.js';
import { getRouteGenerator } from '../../../dist/core/routing/generator.js';
import { stringifyParams } from '../../../dist/core/routing/params.js';
import { dynamicPart, makeRoute, staticPart } from './test-helpers.ts';

interface TestCase {
	routeData: RoutePart[][];
	trailingSlash: AstroConfig['trailingSlash'];
	params: Record<string, string | number>;
	path: string;
}

describe('routing - generator', () => {
	const cases: TestCase[] = [
		{
			routeData: [],
			trailingSlash: 'never',
			params: {},
			path: '/',
		},
		{
			routeData: [],
			trailingSlash: 'always',
			params: {},
			path: '/',
		},
		{
			routeData: [[{ spread: false, content: 'test', dynamic: false }]],
			trailingSlash: 'never',
			params: {},
			path: '/test',
		},
		{
			routeData: [[{ spread: false, content: 'test', dynamic: false }]],
			trailingSlash: 'always',
			params: {},
			path: '/test/',
		},
		{
			routeData: [[{ spread: false, content: 'test', dynamic: false }]],
			trailingSlash: 'always',
			params: { foo: 'bar' },
			path: '/test/',
		},
		{
			routeData: [[{ spread: false, content: 'foo', dynamic: true }]],
			trailingSlash: 'always',
			params: { foo: 'bar' },
			path: '/bar/',
		},
		{
			routeData: [[{ spread: false, content: 'foo', dynamic: true }]],
			trailingSlash: 'never',
			params: { foo: 'bar' },
			path: '/bar',
		},
		{
			routeData: [[{ spread: true, content: '...foo', dynamic: true }]],
			trailingSlash: 'never',
			params: {},
			path: '/',
		},
		{
			routeData: [
				[
					{ spread: true, content: '...foo', dynamic: true },
					{ spread: false, content: '-', dynamic: false },
					{ spread: true, content: '...bar', dynamic: true },
				],
			],
			trailingSlash: 'never',
			params: { foo: 'one', bar: 'two' },
			path: '/one-two',
		},
		{
			routeData: [
				[
					{ spread: true, content: '...foo', dynamic: true },
					{ spread: false, content: '-', dynamic: false },
					{ spread: true, content: '...bar', dynamic: true },
				],
			],
			trailingSlash: 'never',
			params: {},
			path: '/-',
		},
		{
			routeData: [
				[{ spread: true, content: '...foo', dynamic: true }],
				[{ spread: true, content: '...bar', dynamic: true }],
			],
			trailingSlash: 'never',
			params: { foo: 'one' },
			path: '/one',
		},
		{
			routeData: [
				[{ spread: false, content: 'fix', dynamic: false }],
				[{ spread: true, content: '...foo', dynamic: true }],
				[{ spread: true, content: '...bar', dynamic: true }],
			],
			trailingSlash: 'never',
			params: { foo: 'one' },
			path: '/fix/one',
		},
		{
			routeData: [
				[{ spread: false, content: 'fix', dynamic: false }],
				[{ spread: true, content: '...foo', dynamic: true }],
				[{ spread: true, content: '...bar', dynamic: true }],
			],
			trailingSlash: 'always',
			params: { foo: 'one' },
			path: '/fix/one/',
		},
		{
			routeData: [
				[{ spread: false, content: 'fix', dynamic: false }],
				[{ spread: true, content: '...foo', dynamic: true }],
				[{ spread: true, content: '...bar', dynamic: true }],
			],
			trailingSlash: 'never',
			params: { foo: 'one', bar: 'two' },
			path: '/fix/one/two',
		},
		{
			routeData: [
				[{ spread: false, content: 'fix', dynamic: false }],
				[{ spread: true, content: '...foo', dynamic: true }],
				[{ spread: true, content: '...bar', dynamic: true }],
			],
			trailingSlash: 'never',
			params: { foo: 'one&two' },
			path: '/fix/one&two',
		},
		{
			routeData: [
				[{ spread: false, content: 'fix', dynamic: false }],
				[{ spread: false, content: 'page', dynamic: true }],
			],
			trailingSlash: 'never',
			params: { page: 1 },
			path: '/fix/1',
		},
	];

	cases.forEach(({ routeData, trailingSlash, params, path }) => {
		it(`generates ${path}`, () => {
			const generator = getRouteGenerator(routeData, trailingSlash);
			assert.equal(generator(params), path);
		});
	});

	it('should throw an error when a dynamic parameter is missing', () => {
		const generator = getRouteGenerator(
			[[{ spread: false, content: 'foo', dynamic: true }]],
			'never',
		);
		assert.throws(() => generator({}), TypeError);
	});
});

describe('stringifyParams - file endpoint trailing slash', () => {
	it('does not append trailing slash to dynamic file endpoints with trailingSlash always (issue #17241)', () => {
		const route = makeRoute({
			segments: [[staticPart('api')], [dynamicPart('name'), staticPart('.json')]],
			trailingSlash: 'never',
			route: '/api/[name].json',
			pathname: undefined,
			type: 'endpoint',
		});

		const result = stringifyParams({ name: 'foo' }, route, 'always');
		assert.equal(result, '/api/foo.json', 'should not have trailing slash');
	});

	it('still appends trailing slash to dynamic page routes with trailingSlash always', () => {
		const route = makeRoute({
			segments: [[staticPart('blog')], [dynamicPart('slug')]],
			trailingSlash: 'always',
			route: '/blog/[slug]',
			pathname: undefined,
			type: 'page',
		});

		const result = stringifyParams({ slug: 'hello' }, route, 'always');
		assert.equal(result, '/blog/hello/', 'should have trailing slash');
	});

	it('does not append trailing slash to dynamic endpoints without file extensions with trailingSlash never', () => {
		const route = makeRoute({
			segments: [[staticPart('api')], [dynamicPart('name')]],
			trailingSlash: 'never',
			route: '/api/[name]',
			pathname: undefined,
			type: 'endpoint',
		});

		const result = stringifyParams({ name: 'foo' }, route, 'never');
		assert.equal(result, '/api/foo', 'should not have trailing slash');
	});
});
