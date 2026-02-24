import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRoutesFromEntries } from '../../../dist/core/routing/create-manifest.js';

const baseSettings = {
	config: {
		base: '/',
		trailingSlash: 'always',
		pageExtensions: [],
		srcDir: new URL('file:///src/'),
		root: new URL('file:///'),
		redirects: {},
	},
	pageExtensions: [],
	injectedRoutes: [],
};

const logger = {
	warn() {},
};

const stripPattern = (route) => ({
	...route,
	pattern: route.pattern.toString(),
});

describe('route manifest (entries)', () => {
	it('creates routes with trailingSlash=always', () => {
		const settings = {
			...baseSettings,
			config: { ...baseSettings.config, trailingSlash: 'always' },
		};
		const routes = createRoutesFromEntries(
			[
				{ path: 'index.astro', isDir: false },
				{ path: 'about.astro', isDir: false },
				{ path: 'blog', isDir: true },
				{ path: 'blog/index.astro', isDir: false },
				{ path: 'blog/[slug].astro', isDir: false },
			],
			settings,
			logger,
		);

		const output = routes.map(stripPattern);
		assert.deepEqual(
			output.map((r) => ({
				route: r.route,
				pathname: r.pathname,
				pattern: r.pattern,
			})),
			[
				{ route: '/', pathname: '/', pattern: '/^\\/$/' },
				{ route: '/about', pathname: '/about', pattern: '/^\\/about\\/$/' },
				{ route: '/blog', pathname: '/blog', pattern: '/^\\/blog\\/$/' },
				{ route: '/blog/[slug]', pathname: undefined, pattern: '/^\\/blog\\/([^/]+?)\\/$/' },
			],
		);
	});

	it('creates routes with trailingSlash=never', () => {
		const settings = {
			...baseSettings,
			config: { ...baseSettings.config, trailingSlash: 'never' },
		};
		const routes = createRoutesFromEntries(
			[
				{ path: 'index.astro', isDir: false },
				{ path: 'about.astro', isDir: false },
				{ path: 'blog', isDir: true },
				{ path: 'blog/index.astro', isDir: false },
				{ path: 'blog/[slug].astro', isDir: false },
			],
			settings,
			logger,
		);

		const output = routes.map(stripPattern);
		assert.deepEqual(
			output.map((r) => ({
				route: r.route,
				pathname: r.pathname,
				pattern: r.pattern,
			})),
			[
				{ route: '/', pathname: '/', pattern: '/^\\/$/' },
				{ route: '/about', pathname: '/about', pattern: '/^\\/about$/' },
				{ route: '/blog', pathname: '/blog', pattern: '/^\\/blog$/' },
				{ route: '/blog/[slug]', pathname: undefined, pattern: '/^\\/blog\\/([^/]+?)$/' },
			],
		);
	});

	it('creates routes with trailingSlash=ignore', () => {
		const settings = {
			...baseSettings,
			config: { ...baseSettings.config, trailingSlash: 'ignore' },
		};
		const routes = createRoutesFromEntries(
			[
				{ path: 'index.astro', isDir: false },
				{ path: 'about.astro', isDir: false },
				{ path: 'blog', isDir: true },
				{ path: 'blog/index.astro', isDir: false },
				{ path: 'blog/[slug].astro', isDir: false },
			],
			settings,
			logger,
		);

		const output = routes.map(stripPattern);
		assert.deepEqual(
			output.map((r) => ({
				route: r.route,
				pathname: r.pathname,
				pattern: r.pattern,
			})),
			[
				{ route: '/', pathname: '/', pattern: '/^\\/$/' },
				{ route: '/about', pathname: '/about', pattern: '/^\\/about\\/?$/' },
				{ route: '/blog', pathname: '/blog', pattern: '/^\\/blog\\/?$/' },
				{ route: '/blog/[slug]', pathname: undefined, pattern: '/^\\/blog\\/([^/]+?)\\/?$/' },
			],
		);
	});

	it('ignores files and directories with leading underscores', () => {
		const routes = createRoutesFromEntries(
			[
				{ path: '_hidden.astro', isDir: false },
				{ path: '_dir', isDir: true },
				{ path: '_dir/index.astro', isDir: false },
				{ path: 'visible.astro', isDir: false },
			],
			baseSettings,
			logger,
		);

		assert.deepEqual(
			routes.map((route) => route.route),
			['/visible'],
		);
	});

	it('ignores dotfiles and dot directories except .well-known', () => {
		const routes = createRoutesFromEntries(
			[
				{ path: '.hidden.astro', isDir: false },
				{ path: '.git', isDir: true },
				{ path: '.git/index.astro', isDir: false },
				{ path: '.well-known', isDir: true },
				{ path: '.well-known/dnt-policy.astro', isDir: false },
			],
			baseSettings,
			logger,
		);

		assert.deepEqual(
			routes.map((route) => route.route),
			['/.well-known/dnt-policy'],
		);
	});

	it('allows multiple slugs in a single segment', () => {
		const routes = createRoutesFromEntries(
			[{ path: '[file].[ext].astro', isDir: false }],
			baseSettings,
			logger,
		);

		assert.equal(routes.length, 1);
		assert.equal(routes[0].route, '/[file].[ext]');
	});

	it('throws when dynamic params are not separated', () => {
		assert.throws(
			() =>
				createRoutesFromEntries(
					[{ path: '[foo][bar].astro', isDir: false }],
					baseSettings,
					logger,
					'src/pages',
				),
			/parameters must be separated/,
		);
	});

	it('throws when rest params are inside segments', () => {
		assert.throws(
			() =>
				createRoutesFromEntries(
					[{ path: 'foo-[...rest]-bar.astro', isDir: false }],
					baseSettings,
					logger,
					'src/pages',
				),
			/rest parameter must be a standalone segment/,
		);
	});

	it('ignores non-page extensions but keeps valid ones', () => {
		const routes = createRoutesFromEntries(
			[
				{ path: 'index.astro', isDir: false },
				{ path: 'about.astro', isDir: false },
				{ path: 'component.tsx', isDir: false },
				{ path: 'note.md', isDir: false },
				{ path: 'endpoint.ts', isDir: false },
			],
			baseSettings,
			logger,
		);

		assert.deepEqual(
			routes.map((route) => route.route),
			['/', '/about', '/note', '/endpoint'],
		);
		const endpoint = routes.find((route) => route.route === '/endpoint');
		assert.equal(endpoint.type, 'endpoint');
	});

	it('ignores lockfile-like entries with unsupported extensions', () => {
		const routes = createRoutesFromEntries(
			[
				{ path: 'foo.astro', isDir: false },
				{ path: 'package-lock.json', isDir: false },
			],
			baseSettings,
			logger,
		);

		assert.deepEqual(
			routes.map((route) => route.route),
			['/foo'],
		);
	});

	it('sorts routes correctly by priority', () => {
		const routes = createRoutesFromEntries(
			[
				{ path: 'index.astro', isDir: false },
				{ path: 'about.astro', isDir: false },
				{ path: 'post', isDir: true },
				{ path: 'post/index.astro', isDir: false },
				{ path: 'post/bar.astro', isDir: false },
				{ path: 'post/foo.astro', isDir: false },
				{ path: 'post/f[xx].astro', isDir: false },
				{ path: 'post/f[yy].astro', isDir: false },
				{ path: 'post/[id].astro', isDir: false },
				{ path: '[wildcard].astro', isDir: false },
				{ path: '[...rest]', isDir: true },
				{ path: '[...rest]/index.astro', isDir: false },
				{ path: '[...rest]/abc.astro', isDir: false },
				{ path: '[...rest]/deep', isDir: true },
				{ path: '[...rest]/deep/index.astro', isDir: false },
				{ path: '[...rest]/deep/[...deep_rest]', isDir: true },
				{ path: '[...rest]/deep/[...deep_rest]/index.astro', isDir: false },
				{ path: '[...rest]/deep/[...deep_rest]/xyz.astro', isDir: false },
			],
			baseSettings,
			logger,
		);

		assert.deepEqual(
			routes.map((route) => route.component),
			[
				'src/pages/index.astro',
				'src/pages/about.astro',
				'src/pages/post/index.astro',
				'src/pages/post/bar.astro',
				'src/pages/post/foo.astro',
				'src/pages/post/f[xx].astro',
				'src/pages/post/f[yy].astro',
				'src/pages/post/[id].astro',
				'src/pages/[wildcard].astro',
				'src/pages/[...rest]/index.astro',
				'src/pages/[...rest]/abc.astro',
				'src/pages/[...rest]/deep/index.astro',
				'src/pages/[...rest]/deep/[...deep_rest]/index.astro',
				'src/pages/[...rest]/deep/[...deep_rest]/xyz.astro',
			],
		);
	});
});
