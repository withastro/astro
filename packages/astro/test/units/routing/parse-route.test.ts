import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroConfig } from '../../../dist/types/public/config.js';
import type { AstroSettings } from '../../../dist/types/astro.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';

type ParseRouteConfig = Pick<AstroSettings, 'config' | 'pageExtensions'>;

describe('parseRoute', () => {
	it('uses pageExtensions to strip file extensions', () => {
		const options: ParseRouteConfig = {
			config: { base: '/', trailingSlash: 'ignore' } as AstroConfig,
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
