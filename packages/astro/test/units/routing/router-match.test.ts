import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Router } from '../../../dist/core/routing/router.js';
import { dynamicPart, makeRoute, spreadPart, staticPart } from './test-helpers.js';

describe('Router.match', () => {
	it('prefers static routes over dynamic routes', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[dynamicPart('slug')]],
					trailingSlash,
					route: '/[slug]',
					pathname: undefined,
				}),
				makeRoute({
					segments: [[staticPart('about')]],
					trailingSlash,
					route: '/about',
					pathname: '/about',
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		const match = router.match('/about');
		assert.equal(match.type, 'match');
		if (match.type === 'match') {
			assert.equal(match.route.route, '/about');
			assert.deepEqual(match.params, {});
		}
	});

	it('matches dynamic routes and returns params', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[dynamicPart('slug')]],
					trailingSlash,
					route: '/[slug]',
					pathname: undefined,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		const match = router.match('/hello');
		assert.equal(match.type, 'match');
		if (match.type === 'match') {
			assert.equal(match.route.route, '/[slug]');
			assert.deepEqual(match.params, { slug: 'hello' });
		}
	});

	it('prefers single params over spread params', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[staticPart('posts')], [spreadPart('...slug')]],
					trailingSlash,
					route: '/posts/[...slug]',
					pathname: undefined,
				}),
				makeRoute({
					segments: [[staticPart('posts')], [dynamicPart('id')]],
					trailingSlash,
					route: '/posts/[id]',
					pathname: undefined,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		const single = router.match('/posts/one');
		assert.equal(single.type, 'match');
		if (single.type === 'match') {
			assert.equal(single.route.route, '/posts/[id]');
			assert.deepEqual(single.params, { id: 'one' });
		}
		const spread = router.match('/posts/one/two');
		assert.equal(spread.type, 'match');
		if (spread.type === 'match') {
			assert.equal(spread.route.route, '/posts/[...slug]');
			assert.deepEqual(spread.params, { slug: 'one/two' });
		}
	});

	it('prefers partially static dynamic segments over fully dynamic segments', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[dynamicPart('title')]],
					trailingSlash,
					route: '/[title]',
					pathname: undefined,
				}),
				makeRoute({
					segments: [[staticPart('game-'), dynamicPart('title')]],
					trailingSlash,
					route: '/game-[title]',
					pathname: undefined,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		const match = router.match('/game-1');
		assert.equal(match.type, 'match');
		if (match.type === 'match') {
			assert.equal(match.route.route, '/game-[title]');
			assert.deepEqual(match.params, { title: '1' });
		}
	});

	it('handles trailingSlash=always', () => {
		const trailingSlash = 'always' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[staticPart('blog')]],
					trailingSlash,
					route: '/blog',
					pathname: '/blog',
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		assert.equal(router.match('/blog').type, 'none');
		assert.equal(router.match('/blog/').type, 'match');
	});

	it('handles trailingSlash=never', () => {
		const trailingSlash = 'never' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[staticPart('blog')]],
					trailingSlash,
					route: '/blog',
					pathname: '/blog',
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		assert.equal(router.match('/blog').type, 'match');
		assert.equal(router.match('/blog/').type, 'none');
	});

	it('handles trailingSlash=ignore', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[staticPart('blog')]],
					trailingSlash,
					route: '/blog',
					pathname: '/blog',
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		assert.equal(router.match('/blog').type, 'match');
		assert.equal(router.match('/blog/').type, 'match');
	});

	it('matches within base path and rejects outside', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({ segments: [], trailingSlash, route: '/', pathname: '/', isIndex: true }),
				makeRoute({
					segments: [[staticPart('about')]],
					trailingSlash,
					route: '/about',
					pathname: '/about',
				}),
			],
			{ base: '/blog', trailingSlash, buildFormat: 'directory' },
		);
		assert.equal(router.match('/blog').type, 'match');
		assert.equal(router.match('/blog/').type, 'match');
		assert.equal(router.match('/about').type, 'none');
	});

	it('redirects base path when trailingSlash=always', () => {
		const trailingSlash = 'always' as const;
		const router = new Router(
			[makeRoute({ segments: [], trailingSlash, route: '/', pathname: '/', isIndex: true })],
			{ base: '/blog', trailingSlash, buildFormat: 'directory' },
		);
		const match = router.match('/blog');
		assert.equal(match.type, 'redirect');
		if (match.type === 'redirect') {
			assert.equal(match.location, '/blog/');
			assert.equal(match.status, 301);
		}
	});

	it('accepts .html paths when buildFormat=file', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({ segments: [], trailingSlash, route: '/', pathname: '/', isIndex: true }),
				makeRoute({
					segments: [[staticPart('about')]],
					trailingSlash,
					route: '/about',
					pathname: '/about',
				}),
			],
			{ base: '/blog', trailingSlash, buildFormat: 'file' },
		);
		const indexMatch = router.match('/blog/index.html');
		assert.equal(indexMatch.type, 'match');
		if (indexMatch.type === 'match') assert.equal(indexMatch.route.route, '/');

		const aboutMatch = router.match('/blog/about.html');
		assert.equal(aboutMatch.type, 'match');
		if (aboutMatch.type === 'match') assert.equal(aboutMatch.route.route, '/about');
	});

	it('matches [slug].html routes and extracts slug without .html', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[dynamicPart('slug'), staticPart('.html')]],
					trailingSlash,
					route: '/[slug].html',
					pathname: undefined,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		const match = router.match('/dummy.html');
		assert.equal(match.type, 'match');
		if (match.type === 'match') {
			assert.equal(match.route.route, '/[slug].html');
			assert.deepEqual(match.params, { slug: 'dummy' });
		}
	});

	it('[slug].html routes do not match non-.html paths', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[dynamicPart('slug'), staticPart('.html')]],
					trailingSlash,
					route: '/[slug].html',
					pathname: undefined,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		assert.equal(router.match('/dummy').type, 'none');
	});

	it('[slug].html routes still work alongside buildFormat=file stripping', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[staticPart('about')]],
					trailingSlash,
					route: '/about',
					pathname: '/about',
				}),
				makeRoute({
					segments: [[dynamicPart('slug'), staticPart('.html')]],
					trailingSlash,
					route: '/[slug].html',
					pathname: undefined,
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'file' },
		);
		const aboutMatch = router.match('/about.html');
		assert.equal(aboutMatch.type, 'match');
		if (aboutMatch.type === 'match') assert.equal(aboutMatch.route.route, '/about');
		assert.equal(router.match('/dummy.html').type, 'none');
	});

	it('redirects multiple leading slashes at root', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[makeRoute({ segments: [], trailingSlash, route: '/', pathname: '/', isIndex: true })],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		const match = router.match('////');
		assert.equal(match.type, 'redirect');
		if (match.type === 'redirect') assert.equal(match.location, '/');
	});

	it('redirects multiple leading slashes while preserving path', () => {
		const trailingSlash = 'ignore' as const;
		const router = new Router(
			[
				makeRoute({
					segments: [[staticPart('foo')], [staticPart('bar')]],
					trailingSlash,
					route: '/foo/bar',
					pathname: '/foo/bar',
				}),
			],
			{ base: '/', trailingSlash, buildFormat: 'directory' },
		);
		const match = router.match('//foo/bar');
		assert.equal(match.type, 'redirect');
		if (match.type === 'redirect') {
			assert.equal(match.location, '/foo/bar');
			assert.equal(match.status, 301);
		}
	});
});
