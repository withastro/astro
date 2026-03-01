import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';

describe('parseRoute', () => {
	it('uses pageExtensions to strip file extensions', () => {
		const options = {
			config: { base: '/', trailingSlash: 'ignore' },
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
});
