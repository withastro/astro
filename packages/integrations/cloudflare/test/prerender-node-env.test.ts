import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('prerenderEnvironment: node', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender-node-env/', import.meta.url).toString(),
			adapter: cloudflare({
				prerenderEnvironment: 'node',
			}),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
		await fixture.clean();
	});

	it('renders prerendered page using Node.js APIs', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		assert.ok(
			html.includes('id="pkg-name"'),
			'Expected the prerendered page to contain the pkg-name element',
		);
		// The package.json name should be read via node:fs — cwd resolves to
		// the cloudflare package root, so we check for that name
		assert.ok(
			html.includes('@astrojs/cloudflare'),
			'Expected node:fs to successfully read a package.json name',
		);
	});

	it('renders svelte component that imports .svelte files from node_modules', async () => {
		const res = await fixture.fetch('/svelte');
		assert.equal(res.status, 200);
		const html = await res.text();
		assert.ok(
			html.includes('id="svelte-wrapper"'),
			'Expected the prerendered page to contain the svelte wrapper',
		);
		assert.ok(
			html.includes('Hello from fake svelte component'),
			'Expected the fake svelte component to be rendered',
		);
	});

	it('includes styles in prerendered page', async () => {
		const res = await fixture.fetch('/');
		const html = await res.text();
		assert.ok(
			html.includes('rebeccapurple'),
			'Expected scoped styles to be included in the prerendered page',
		);
	});

	it('serves server islands for prerendered routes in dev', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();
		assert.ok(
			html.includes('id="deferred-fallback"'),
			'Expected fallback content in prerendered HTML',
		);

		const islandUrlMatch = /fetch\('(\/_server-islands\/[^']+)'/.exec(html);
		assert.ok(islandUrlMatch, 'Expected prerendered HTML to include a server island fetch URL');

		const islandRes = await fixture.fetch(islandUrlMatch[1]);
		assert.equal(islandRes.status, 200, 'Expected server island endpoint to return 200 in dev');
		const islandHtml = await islandRes.text();
		assert.ok(
			islandHtml.includes('id="deferred-content"'),
			'Expected server island response to include deferred island content',
		);
	});

	it('serves server islands through workerd runtime (not Node prerender env)', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
		const html = await res.text();

		const islandUrlMatches = [...html.matchAll(/fetch\((['"])(\/_server-islands\/[^'"]+)\1/g)];
		assert.ok(
			islandUrlMatches.length > 0,
			'Expected prerendered HTML to include server island fetch URLs',
		);

		let sawWorkerdIsland = false;
		for (const islandUrlMatch of islandUrlMatches) {
			const islandRes = await fixture.fetch(islandUrlMatch[2]);
			assert.equal(islandRes.status, 200, 'Expected server island endpoint to return 200');
			const islandHtml = await islandRes.text();

			if (islandHtml.includes('id="island-has-cf"')) {
				sawWorkerdIsland = true;
				assert.ok(
					islandHtml.includes('>true<'),
					'Expected server island to have access to Astro.request.cf (runs in workerd, not Node)',
				);
				break;
			}
		}

		assert.ok(
			sawWorkerdIsland,
			'Expected at least one server island response to include the WorkerdIsland marker',
		);
	});

	it('renders SSR page through workerd with Astro.request.cf', async () => {
		const res = await fixture.fetch('/ssr');
		assert.equal(res.status, 200);
		const html = await res.text();
		assert.ok(html.includes('id="has-cf"'), 'Expected the SSR page to contain the has-cf element');
		assert.ok(html.includes('>true<'), 'Expected Astro.request.cf to be available in the SSR page');
	});
});
