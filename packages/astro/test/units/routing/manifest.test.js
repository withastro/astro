import { expect } from 'chai';

import { fileURLToPath } from 'node:url';
import { createRouteManifest } from '../../../dist/core/routing/manifest/create.js';
import { createBasicSettings, createFs, defaultLogger } from '../test-utils.js';

const root = new URL('../../fixtures/alias/', import.meta.url);

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
			base: '/search',
			trailingSlash: 'never',
			redirects: {
				'/blog/[...slug]': '/',
				'/blog/contributing': '/another',
			},
		});
		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});

		expect(manifest.routes[1].route).to.equal('/blog/contributing');
		expect(manifest.routes[1].type).to.equal('page');
		expect(manifest.routes[3].route).to.equal('/blog/[...slug]');
	});

	it('static redirect route is prioritized over dynamic file route', async () => {
		const fs = createFs(
			{
				'/src/pages/[...slug].astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			trailingSlash: 'never',
			redirects: {
				'/foo': '/bar',
			},
		});
		const manifest = createRouteManifest(
			{
				cwd: fileURLToPath(root),
				settings,
				fsMod: fs,
			},
			defaultLogger
		);

		expect(manifest.routes[0].route).to.equal('/foo');
	});
});
