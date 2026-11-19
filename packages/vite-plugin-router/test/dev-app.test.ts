import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import {
	createServer,
	createServerHotChannel,
	createServerModuleRunner,
	DevEnvironment,
	type Plugin,
	type ViteDevServer,
} from 'vite';
import type { ModuleRunner } from 'vite/module-runner';
import router from '../dist/index.js';

const root = new URL('./fixtures/server-output/', import.meta.url);
const addedPage = new URL('./src/pages/added.astro', root);
const prerenderedPage = new URL('./src/pages/prerendered.astro', root);
const dynamicPage = new URL('./src/pages/posts/[id].astro', root);

describe('@astrojs/vite-plugin-router/app in dev, in a server environment Vite cannot run', () => {
	let server: ViteDevServer;
	let runner: ModuleRunner;
	let app: { fetch(request: Request): Promise<Response>; match(request: Request): boolean };

	before(async () => {
		mkdirSync(new URL('.', dynamicPage), { recursive: true });
		writeFileSync(dynamicPage, '<h1>Post {Astro.params.id}</h1>\n');
		writeFileSync(
			prerenderedPage,
			'---\nexport const prerender = true;\n---\n<h1>Prerendered</h1>\n',
		);
		// A plugin that loads the route table and manifest modules before `router()` configures the
		// server, like the Cloudflare plugin does when it starts its worker.
		const loadRoutesEarly: Plugin = {
			name: 'load-routes-early',
			configureServer: {
				order: 'pre',
				async handler(devServer) {
					await devServer.environments.ssr.transformRequest('virtual:astro:manifest');
					await devServer.environments.ssr.transformRequest('virtual:astro:routes');
				},
			},
		};
		server = await createServer({
			root: fileURLToPath(root),
			configFile: false,
			logLevel: 'silent',
			server: { port: 0, ws: false },
			plugins: [loadRoutesEarly, astro(), router({ output: 'server' })],
			environments: {
				ssr: {
					dev: {
						createEnvironment: (name, config) =>
							new DevEnvironment(name, config, { hot: true, transport: createServerHotChannel() }),
					},
				},
			},
		});
		await server.listen();
		runner = createServerModuleRunner(server.environments.ssr);
		app = (await runner.import('@astrojs/vite-plugin-router/app')).default;
	});

	after(async () => {
		rmSync(addedPage, { force: true });
		rmSync(prerenderedPage, { force: true });
		rmSync(new URL('.', dynamicPage), { recursive: true, force: true });
		await runner?.close();
		await server?.close();
	});

	it('matches on-demand and prerendered routes', () => {
		assert.equal(app.match(new Request('http://localhost/greet')), true);
		assert.equal(app.match(new Request('http://localhost/api/echo')), true);
		assert.equal(app.match(new Request('http://localhost/')), true);
		assert.equal(app.match(new Request('http://localhost/prerendered')), true);
		assert.equal(app.match(new Request('http://localhost/missing')), false);
	});

	it('renders on-demand and prerendered pages', async () => {
		const greet = await app.fetch(new Request('http://localhost/greet?name=dev'));
		assert.equal(greet.status, 200);
		assert.match(await greet.text(), /<h1>Hello dev<\/h1>/);
		// A dynamic on-demand page needs no `getStaticPaths()`.
		const post = await app.fetch(new Request('http://localhost/posts/first'));
		assert.equal(post.status, 200);
		assert.match(await post.text(), /<h1>Post first<\/h1>/);
		const prerendered = await app.fetch(new Request('http://localhost/prerendered'));
		assert.equal(prerendered.status, 200);
		assert.match(await prerendered.text(), /<h1>Prerendered<\/h1>/);
	});

	it('matches a page added while the server runs', async () => {
		const request = () => new Request('http://localhost/added');
		assert.equal(app.match(request()), false);
		writeFileSync(addedPage, '<h1>Added</h1>\n');
		for (let i = 0; i < 100 && !app.match(request()); i++) await delay(50);
		assert.equal(app.match(request()), true);
		const response = await app.fetch(request());
		assert.match(await response.text(), /<h1>Added<\/h1>/);
	});
});
