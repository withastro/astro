import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer, type Plugin, type ViteDevServer } from 'vite';
import { getRouterApi, type RouterPluginApi } from '../dist/index.js';

const root = fileURLToPath(new URL('./fixtures/basic/', import.meta.url));

describe('router() in plain Vite: dev', () => {
	let server: ViteDevServer;
	let origin: string;
	let api: RouterPluginApi;

	before(async () => {
		// A feature plugin injecting an on-demand route, like the actions RPC endpoint.
		const feature: Plugin = {
			name: 'feature',
			configResolved(config) {
				api = getRouterApi(config);
				api.injectRoute({
					pattern: '/_feature/rpc',
					entrypoint: new URL('./fixtures/basic/src/feature/rpc.ts', import.meta.url),
					prerender: false,
				});
				api.addPageExtension('.txt');
			},
		};
		server = await createServer({
			root,
			logLevel: 'silent',
			server: { port: 0 },
			plugins: [feature],
		});
		await server.listen();
		origin = server.resolvedUrls!.local[0].replace(/\/$/, '');
	});

	after(async () => {
		await server.close();
	});

	it('renders a page from src/pages', async () => {
		const response = await fetch(`${origin}/`);
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.match(html, /<title>Home<\/title>/);
		assert.match(html, /<h1>Home<\/h1>/);
		assert.match(html, /<script type="module" src="\/@vite\/client"><\/script>/);
	});

	it('renders the paths of getStaticPaths()', async () => {
		const response = await fetch(`${origin}/blog/second`);
		assert.equal(response.status, 200);
		assert.match(await response.text(), /<h1>Post second<\/h1>/);
	});

	it('serves endpoints', async () => {
		const response = await fetch(`${origin}/data.json`);
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), { ok: true });
	});

	it('serves injected routes, which count as server output', async () => {
		const response = await fetch(`${origin}/_feature/rpc`, { method: 'POST' });
		assert.equal(response.status, 200);
		assert.deepEqual(await response.json(), { rpc: true });
		assert.equal(api.hasServerOutput(), false);
		assert.ok(api.routes.some((route) => route.route === '/_feature/rpc' && !route.prerender));
	});

	it('routes files with registered page extensions', () => {
		assert.ok(api.routes.some((route) => route.route === '/notes' && route.type === 'page'));
	});

	it("replaces the Vite error overlay with Astro's", async () => {
		const response = await fetch(`${origin}/@vite/client`);
		assert.match(await response.text(), /var ViteErrorOverlay/);
	});

	it('renders the 404 page for unknown paths', async () => {
		for (const path of ['/nope', '/blog/third']) {
			const response = await fetch(origin + path);
			assert.equal(response.status, 404);
			assert.match(await response.text(), /<h1>Not found<\/h1>/);
		}
	});
});
