import { expect } from 'chai';

import { fileURLToPath } from 'node:url';
import { createRouteManifest } from '../../../dist/core/routing/manifest/create.js';
import { createBasicSettings, createFs, defaultLogger } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

function getManifestRoutes(manifest) {
	return manifest.routes.map(route => ({
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
			root,
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			base: '/search',
			trailingSlash: 'never',
		});

		settings.injectedRoutes = [
			{
				pattern: '/about',
				entrypoint: '@lib/override/static.astro',
			},
			{
				pattern: '/api',
				entrypoint: '@lib/override/static.ts',
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
				route: '/about',
				type: 'page',
			},
			{
				route: '/sendcontact',
				type: 'endpoint',
			},
			{
				route: '/contact-me',
				type: 'page',
			},
		]);
	});

	it('injected routes are sorted as specified above filesystem routes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
				'/src/pages/blog/[...slug].astro': `<h1>test</h1>`,
			},
			root,
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
				entrypoint: '@lib/override/static.astro',
				priority: 'override',
			},
			{
				pattern: '/[...slug]',
				entrypoint: '@lib/override/dynamic.astro',
				// Don's specify a priority to test that it defaults to override
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

	it('injected routes are sorted as specified below filesystem routes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
				'/src/pages/blog/[...slug].astro': `<h1>test</h1>`,
			},
			root,
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
				entrypoint: '@lib/override/static.astro',
				priority: 'defer',
			},
			{
				pattern: '/[...slug]',
				entrypoint: '@lib/override/dynamic.astro',
				priority: 'defer',
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
				route: '/',
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
		]);
	});

	it('injected routes are sorted as specified alongside filesystem routes', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
				'/src/pages/blog/[...slug].astro': `<h1>test</h1>`,
			},
			root,
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
						'astro:config:setup': ({injectRoute}) => {
						},
					},
				},
			],
		});

		settings.injectedRoutes = [
			{
				pattern: '/contributing',
				entrypoint: '@lib/override/static.astro',
				priority: 'normal',
			},
			{
				pattern: '/[...slug]',
				entrypoint: '@lib/override/dynamic.astro',
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

	it('redirects are sorted as specified above the filesystem routes', async () => {
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
				// Do not specify a priority to test that it defaults to defer
				'/blog/[...slug]': {
					status: 302,
					destination: '/',
					priority: 'override',
				},
				'/blog/about': {
					status: 302,
					destination: '/another',
					priority: 'override',
				}
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
				route: '/blog/[...slug]',
				type: 'redirect',
			},
			{
				route: '/blog/contributing',
				type: 'page',
			},
			{
				route: '/',
				type: 'page',
			},
		]);
	});

	it('redirects are sorted as specified below the filesystem routes', async () => {
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
				// Do not specify a priority to test that it defaults to defer
				'/blog/[...slug]': '/',
				'/blog/about': {
					status: 302,
					destination: '/another',
					priority: 'defer',
				}
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

	it('redirects are sorted as specified alongside the filesystem routes', async () => {
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
					priority: 'normal',
				},
				'/blog/about': {
					status: 302,
					destination: '/another',
					priority: 'normal',
				}
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
});
