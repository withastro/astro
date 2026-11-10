import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseRoute } from '@astrojs/vite-plugin-router/_internal/core/routing/parse-route.js';

type ParseRouteConfig = Parameters<typeof parseRoute>[1];

describe('parseRoute', () => {
	it('uses pageExtensions to strip file extensions', () => {
		const options: ParseRouteConfig = {
			base: '/',
			trailingSlash: 'ignore',
			pageExtensions: ['.mdx'],
		};

		const indexRoute = parseRoute('blog/index.mdx', options, {
			component: 'src/pages/blog/index.mdx',
		});
		assert.equal(indexRoute.route, '/blog');
		assert.equal(indexRoute.isIndex, true);

		const pageRoute = parseRoute('blog/post.mdx', options, {
			component: 'src/pages/blog/post.mdx',
		});
		assert.equal(pageRoute.route, '/blog/post');
		assert.equal(pageRoute.isIndex, false);
	});

	it('preserves casing of dynamic param names in route pattern', () => {
		const options: ParseRouteConfig = {
			base: '/',
			trailingSlash: 'ignore',
			pageExtensions: [],
		};

		const route = parseRoute('blog/[postId].astro', options, {
			component: 'src/pages/blog/[postId].astro',
		});
		assert.equal(route.route, '/blog/[postId]');
		assert.deepEqual(route.params, ['postId']);
	});

	it('preserves casing of multiple camelCase dynamic params', () => {
		const options: ParseRouteConfig = {
			base: '/',
			trailingSlash: 'ignore',
			pageExtensions: [],
		};

		const route = parseRoute('users/[userId]/posts/[postSlug].astro', options, {
			component: 'src/pages/users/[userId]/posts/[postSlug].astro',
		});
		assert.equal(route.route, '/users/[userId]/posts/[postSlug]');
		assert.deepEqual(route.params, ['userId', 'postSlug']);
	});
});
