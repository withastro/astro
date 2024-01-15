import { expect } from 'chai';

import { fileURLToPath } from 'node:url';
import { createRouteManifest } from '../../../dist/core/routing/manifest/create.js';
import { createBasicSettings, createFs, defaultLogger } from '../test-utils.js';
import { Logger } from '../../../dist/core/logger/core.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

function getManifestRoutes(manifest) {
	return manifest.routes.map((route) => ({
		type: route.type,
		route: route.route,
	}));
}

describe('routing - createRouteManifest', () => {
	it('using trailingSlash: "never" does not match the index route when it contains a trailing slash', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			base: '/search',
			trailingSlash: 'never',
		});
		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});
		const [{ pattern }] = manifest.routes;
		expect(pattern.test('')).to.equal(true);
		expect(pattern.test('/')).to.equal(false);
	});

	it('endpoint routes are sorted before page routes', async () => {
		const fs = createFs(
			{
				'/src/pages/contact-me.astro': `<h1>test</h1>`,
				'/src/pages/sendContact.ts': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			base: '/search',
			trailingSlash: 'never',
			experimental: {
				stableRoutingPriority: true,
			},
		});

		settings.injectedRoutes = [
			{
				pattern: '/about',
				entrypoint: '@lib/legacy/static.astro',
			},
			{
				pattern: '/api',
				entrypoint: '@lib/legacy/static.ts',
			},
		];

		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});

		expect(getManifestRoutes(manifest)).to.deep.equal([
			{
				route: '/api',
				type: 'endpoint',
			},
			{
				route: '/sendcontact',
				type: 'endpoint',
			},
			{
				route: '/about',
				type: 'page',
			},
			{
				route: '/contact-me',
				type: 'page',
			},
		]);
	});

	it('injected routes are sorted in legacy mode above filesystem routes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
				'/src/pages/blog/[...slug].astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			base: '/search',
			trailingSlash: 'never',
		});

		settings.injectedRoutes = [
			{
				pattern: '/contributing',
				entrypoint: '@lib/legacy/static.astro',
			},
			{
				pattern: '/[...slug]',
				entrypoint: '@lib/legacy/dynamic.astro',
			},
		];

		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});

		expect(getManifestRoutes(manifest)).to.deep.equal([
			{
				route: '/contributing',
				type: 'page',
			},
			{
				route: '/[...slug]',
				type: 'page',
			},
			{
				route: '/blog/[...slug]',
				type: 'page',
			},
			{
				route: '/',
				type: 'page',
			},
		]);
	});

	it('injected routes are sorted alongside filesystem routes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
				'/src/pages/blog/[...slug].astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			base: '/search',
			trailingSlash: 'never',
			integrations: [
				{
					name: '@test',
					hooks: {
						'astro:config:setup': ({ injectRoute }) => {},
					},
				},
			],
			experimental: {
				stableRoutingPriority: true,
			},
		});

		settings.injectedRoutes = [
			{
				pattern: '/contributing',
				entrypoint: '@lib/legacy/static.astro',
			},
			{
				pattern: '/[...slug]',
				entrypoint: '@lib/legacy/dynamic.astro',
				priority: 'normal',
			},
		];

		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});

		expect(getManifestRoutes(manifest)).to.deep.equal([
			{
				route: '/blog/[...slug]',
				type: 'page',
			},
			{
				route: '/contributing',
				type: 'page',
			},
			{
				route: '/[...slug]',
				type: 'page',
			},
			{
				route: '/',
				type: 'page',
			},
		]);
	});

	it('redirects are sorted in legacy mode below the filesystem routes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
				'/src/pages/blog/contributing.astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			base: '/search',
			trailingSlash: 'never',
			redirects: {
				'/blog/[...slug]': '/',
				'/blog/about': {
					status: 302,
					destination: '/another',
				},
			},
		});
		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});

		expect(getManifestRoutes(manifest)).to.deep.equal([
			{
				route: '/blog/contributing',
				type: 'page',
			},
			{
				route: '/',
				type: 'page',
			},
			{
				route: '/blog/about',
				type: 'redirect',
			},
			{
				route: '/blog/[...slug]',
				type: 'redirect',
			},
		]);
	});

	it('redirects are sorted alongside the filesystem routes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
				'/src/pages/blog/contributing.astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			base: '/search',
			trailingSlash: 'never',
			redirects: {
				'/blog/[...slug]': {
					status: 302,
					destination: '/',
				},
				'/blog/about': {
					status: 302,
					destination: '/another',
				},
			},
			experimental: {
				stableRoutingPriority: true,
			},
		});
		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});

		expect(getManifestRoutes(manifest)).to.deep.equal([
			{
				route: '/blog/about',
				type: 'redirect',
			},
			{
				route: '/blog/contributing',
				type: 'page',
			},
			{
				route: '/blog/[...slug]',
				type: 'redirect',
			},
			{
				route: '/',
				type: 'page',
			},
		]);
	});

	// it should not throw an error, for now
	it.skip('rejects colliding static routes', async () => {
		const fs = createFs(
			{
				'/src/pages/contributing.astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			base: '/search',
			trailingSlash: 'never',
			integrations: [],
		});

		settings.injectedRoutes = [
			{
				pattern: '/contributing',
				entrypoint: '@lib/legacy/static.astro',
			},
		];

		try {
			createRouteManifest({
				cwd: fileURLToPath(root),
				settings,
				fsMod: fs,
			});
			expect.fail(0, 1, 'Expected createRouteManifest to throw');
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.type).to.equal('AstroError');
			expect(e.name).to.equal('StaticRouteCollision');
			expect(e.message).to.equal(
				'The route "/contributing" is defined in both "src/pages/contributing.astro" and "@lib/legacy/static.astro". A static route cannot be defined more than once.'
			);
		}
	});

	it.skip('rejects colliding SSR dynamic routes', async () => {
		const fs = createFs(
			{
				'/src/pages/[foo].astro': `<h1>test</h1>`,
				'/src/pages/[bar].astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			base: '/search',
			trailingSlash: 'never',
			integrations: [],
		});

		try {
			createRouteManifest({
				cwd: fileURLToPath(root),
				settings,
				fsMod: fs,
			});
			expect.fail(0, 1, 'Expected createRouteManifest to throw');
		} catch (e) {
			expect(e).to.be.instanceOf(Error);
			expect(e.type).to.equal('AstroError');
			expect(e.name).to.equal('DynamicRouteCollision');
			expect(e.message).to.equal(
				'The route "/[bar]" is defined in both "src/pages/[bar].astro" and "src/pages/[foo].astro" using SSR mode. A dynamic SSR route cannot be defined more than once.'
			);
		}
	});
});
