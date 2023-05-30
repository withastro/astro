import { expect } from 'chai';

import { createFs } from '../test-utils.js';
import { createRouteManifest } from '../../../dist/core/routing/manifest/create.js';
import { createDefaultDevSettings } from '../../../dist/core/config/index.js';
import { fileURLToPath } from 'url';

const root = new URL('../../fixtures/alias/', import.meta.url);

describe('routing - createRouteManifest', () => {
	it('using trailingSlash: "never" does not match the index route when it contains a trailing slash', async () => {
		const fs = createFs(
			{
				'/src/pages/index.astro': `<h1>test</h1>`,
			},
			root
		);
		const settings = await createDefaultDevSettings(
			{
				base: '/search',
				trailingSlash: 'never',
			},
			root
		);
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
		const settings = await createDefaultDevSettings(
			{
				base: '/search',
				trailingSlash: 'never',
				redirects: {
					'/blog/[...slug]': '/',
					'/blog/contributing': '/another',
				}
			},
			root
		);
		const manifest = createRouteManifest({
			cwd: fileURLToPath(root),
			settings,
			fsMod: fs,
		});
		
		expect(manifest.routes[1].route).to.equal('/blog/contributing');
		expect(manifest.routes[1].type).to.equal('page');
		expect(manifest.routes[2].route).to.equal('/blog/[...slug]');
	})
});
