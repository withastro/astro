import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRouteAssets } from '../../../dist/core/render/ssr-element.js';
import type { RouteInfo } from '../../../dist/core/app/types.js';

function makeRouteInfo(
	route: string,
	overrides: Partial<Pick<RouteInfo, 'styles' | 'scripts' | 'links'>> = {},
): RouteInfo {
	return {
		routeData: { route } as RouteInfo['routeData'],
		file: `src/pages${route === '/' ? '/index' : route}.astro`,
		links: overrides.links ?? [],
		scripts: overrides.scripts ?? [],
		styles: overrides.styles ?? [],
	};
}

describe('getRouteAssets', () => {
	it('returns empty arrays when route is not found', () => {
		const routes = [makeRouteInfo('/about')];
		const result = getRouteAssets('/missing', routes);
		assert.deepEqual(result, { styles: [], scripts: [], links: [] });
	});

	it('returns empty arrays when route has no assets', () => {
		const routes = [makeRouteInfo('/')];
		const result = getRouteAssets('/', routes);
		assert.deepEqual(result, { styles: [], scripts: [], links: [] });
	});

	it('returns inline CSS in styles', () => {
		const routes = [
			makeRouteInfo('/', {
				styles: [
					{ type: 'inline', content: 'body { color: red }' },
					{ type: 'inline', content: '.header { font-size: 2rem }' },
				],
			}),
		];
		const result = getRouteAssets('/', routes);
		assert.deepEqual(result.styles, ['body { color: red }', '.header { font-size: 2rem }']);
	});

	it('returns external stylesheet URLs in links', () => {
		const routes = [
			makeRouteInfo('/', {
				styles: [
					{ type: 'external', src: '/_astro/index.abc12.css' },
					{ type: 'external', src: '/_astro/global.def34.css' },
				],
			}),
		];
		const result = getRouteAssets('/', routes);
		assert.deepEqual(result.links, ['/_astro/index.abc12.css', '/_astro/global.def34.css']);
		assert.deepEqual(result.styles, []);
	});

	it('splits mixed inline and external styles correctly', () => {
		const routes = [
			makeRouteInfo('/', {
				styles: [
					{ type: 'inline', content: 'body { color: red }' },
					{ type: 'external', src: '/_astro/style.css' },
				],
			}),
		];
		const result = getRouteAssets('/', routes);
		assert.deepEqual(result.styles, ['body { color: red }']);
		assert.deepEqual(result.links, ['/_astro/style.css']);
	});

	it('returns external script URLs', () => {
		const routes = [
			makeRouteInfo('/', {
				scripts: [{ type: 'external', value: '/_astro/app.abc12.js' }],
			}),
		];
		const result = getRouteAssets('/', routes);
		assert.deepEqual(result.scripts, ['/_astro/app.abc12.js']);
	});

	it('skips inline scripts', () => {
		const routes = [
			makeRouteInfo('/', {
				scripts: [
					{ type: 'inline', value: 'console.log("hi")' },
					{ type: 'external', value: '/_astro/app.js' },
				],
			}),
		];
		const result = getRouteAssets('/', routes);
		assert.deepEqual(result.scripts, ['/_astro/app.js']);
	});

	it('skips head-inline stage scripts', () => {
		const routes = [
			makeRouteInfo('/', {
				scripts: [
					{ children: 'console.log("inline")', stage: 'head-inline' },
					{ type: 'external', value: '/_astro/app.js' },
				],
			}),
		];
		const result = getRouteAssets('/', routes);
		assert.deepEqual(result.scripts, ['/_astro/app.js']);
	});

	it('applies base path to external link URLs', () => {
		const routes = [
			makeRouteInfo('/', {
				styles: [{ type: 'external', src: '/_astro/style.css' }],
			}),
		];
		const result = getRouteAssets('/', routes, '/docs/');
		assert.equal(result.links[0], '/docs/_astro/style.css');
	});

	it('applies base path to external script URLs', () => {
		const routes = [
			makeRouteInfo('/', {
				scripts: [{ type: 'external', value: '/_astro/app.js' }],
			}),
		];
		const result = getRouteAssets('/', routes, '/docs/');
		assert.equal(result.scripts[0], '/docs/_astro/app.js');
	});

	it('applies string assetsPrefix to link URLs', () => {
		const routes = [
			makeRouteInfo('/', {
				styles: [{ type: 'external', src: '/_astro/style.css' }],
			}),
		];
		const result = getRouteAssets('/', routes, '/', 'https://cdn.example.com');
		assert.ok(result.links[0].startsWith('https://cdn.example.com'));
	});

	it('applies per-type assetsPrefix to link URLs', () => {
		const routes = [
			makeRouteInfo('/', {
				styles: [{ type: 'external', src: '/_astro/style.css' }],
			}),
		];
		const result = getRouteAssets('/', routes, '/', {
			css: 'https://css.cdn.com',
			fallback: 'https://cdn.com',
		});
		assert.ok(result.links[0].startsWith('https://css.cdn.com'));
	});

	it('applies per-type assetsPrefix to script URLs', () => {
		const routes = [
			makeRouteInfo('/', {
				scripts: [{ type: 'external', value: '/_astro/app.js' }],
			}),
		];
		const result = getRouteAssets('/', routes, '/', {
			js: 'https://js.cdn.com',
			fallback: 'https://cdn.com',
		});
		assert.ok(result.scripts[0].startsWith('https://js.cdn.com'));
	});

	it('matches the correct route among multiple routes', () => {
		const routes = [
			makeRouteInfo('/', {
				styles: [{ type: 'external', src: '/_astro/home.css' }],
			}),
			makeRouteInfo('/about', {
				styles: [{ type: 'external', src: '/_astro/about.css' }],
			}),
			makeRouteInfo('/blog/[slug]', {
				styles: [{ type: 'external', src: '/_astro/blog.css' }],
			}),
		];

		const home = getRouteAssets('/', routes);
		assert.deepEqual(home.links, ['/_astro/home.css']);

		const about = getRouteAssets('/about', routes);
		assert.deepEqual(about.links, ['/_astro/about.css']);

		const blog = getRouteAssets('/blog/[slug]', routes);
		assert.deepEqual(blog.links, ['/_astro/blog.css']);
	});
});
