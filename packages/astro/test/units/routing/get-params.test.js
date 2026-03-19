// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { getParams } from '../../../dist/core/render/params-and-props.js';
import { dynamicPart, makeRoute, spreadPart, staticPart } from './test-helpers.js';
import { createTestApp, createPage } from '../mocks.js';

describe('getParams', () => {
	describe('basic dynamic routes', () => {
		it('extracts a single dynamic param', () => {
			const route = makeRoute({
				route: '/[category]',
				segments: [[dynamicPart('category')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/food');
			assert.deepEqual(params, { category: 'food' });
		});

		it('extracts multiple dynamic params', () => {
			const route = makeRoute({
				route: '/[x]/[y]/[z]',
				segments: [[dynamicPart('x')], [dynamicPart('y')], [dynamicPart('z')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/a/b/c');
			assert.deepEqual(params, { x: 'a', y: 'b', z: 'c' });
		});

		it('extracts params with static segments mixed in', () => {
			const route = makeRoute({
				route: '/blog/[slug]/edit',
				segments: [[staticPart('blog')], [dynamicPart('slug')], [staticPart('edit')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/blog/my-post/edit');
			assert.deepEqual(params, { slug: 'my-post' });
		});
	});

	describe('spread routes', () => {
		it('extracts a spread param', () => {
			const route = makeRoute({
				route: '/[...path]',
				segments: [[spreadPart('...path')]],
				trailingSlash: 'ignore',
				pathname: undefined,
				params: ['...path'],
			});
			const params = getParams(route, '/a/b/c');
			assert.deepEqual(params, { path: 'a/b/c' });
		});

		it('returns undefined for an unmatched spread param', () => {
			const route = makeRoute({
				route: '/[...path]',
				segments: [[spreadPart('...path')]],
				trailingSlash: 'ignore',
				pathname: undefined,
				params: ['...path'],
			});
			const params = getParams(route, '/');
			assert.equal(params.path, undefined);
		});
	});

	describe('no params', () => {
		it('returns empty object for static routes', () => {
			const route = makeRoute({
				route: '/about',
				segments: [[staticPart('about')]],
				trailingSlash: 'ignore',
				pathname: '/about',
			});
			const params = getParams(route, '/about');
			assert.deepEqual(params, {});
		});
	});

	describe('encoding', () => {
		it('preserves literal bracket characters in params', () => {
			const route = makeRoute({
				route: '/[category]',
				segments: [[dynamicPart('category')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/[page]');
			assert.equal(params.category, '[page]');
		});

		it('handles percent-encoded input that was decoded upstream', () => {
			// In practice, the HTTP server decodes %5B/%5D to [/] before reaching getParams.
			// This test verifies getParams works with the decoded form.
			const route = makeRoute({
				route: '/[category]',
				segments: [[dynamicPart('category')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/[page]');
			assert.equal(params.category, '[page]');
		});

		it('does not decode %23 (#)', () => {
			const route = makeRoute({
				route: '/[category]',
				segments: [[dynamicPart('category')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/%23something');
			assert.equal(params.category, '%23something');
		});

		it('does not decode %2F (/)', () => {
			const route = makeRoute({
				route: '/[category]',
				segments: [[dynamicPart('category')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/%2Fsomething');
			assert.equal(params.category, '%2Fsomething');
		});

		it('does not decode %3F (?)', () => {
			const route = makeRoute({
				route: '/[category]',
				segments: [[dynamicPart('category')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/%3Fsomething');
			assert.equal(params.category, '%3Fsomething');
		});
	});

	describe('.html suffix', () => {
		it('strips .html before matching params', () => {
			const route = makeRoute({
				route: '/[category]',
				segments: [[dynamicPart('category')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/food.html');
			assert.equal(params.category, 'food');
		});
	});

	describe('no match', () => {
		it('returns empty object when pattern does not match', () => {
			const route = makeRoute({
				route: '/blog/[slug]',
				segments: [[staticPart('blog')], [dynamicPart('slug')]],
				trailingSlash: 'ignore',
				pathname: undefined,
			});
			const params = getParams(route, '/other/something');
			assert.deepEqual(params, {});
		});
	});
});

describe('Params rendered via App', () => {
	const paramPage = createComponent((result, props, slots) => {
		const Astro = result.createAstro(props, slots);
		const { category } = Astro.params;
		return render`<h2 class="category">${category}</h2>`;
	});

	function createParamApp(options = {}) {
		return createTestApp(
			[
				createPage(paramPage, {
					route: '/[category]',
					segments: [[dynamicPart('category')]],
					pathname: undefined,
				}),
			],
			{ base: options.base ?? '/' },
		);
	}

	it('passes params to a rendered component', async () => {
		const app = createParamApp();
		const res = await app.render(new Request('http://example.com/food'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('.category').text(), 'food');
	});

	it('passes params with a base path', async () => {
		const app = createParamApp({ base: '/users/houston/' });
		const res = await app.render(new Request('http://example.com/users/houston/food'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('.category').text(), 'food');
	});

	it('handles non-english characters in params', async () => {
		const app = createParamApp();
		const res = await app.render(new Request('http://example.com/你好'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('.category').text(), '你好');
	});
});
