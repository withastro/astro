import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { it } from 'node:test';
import { createServer as createViteServer } from 'vite';
import { dev } from '../dist/core/index.js';
import { MutableDataStore } from '../dist/content/mutable-data-store.js';
import { getDataStoreFile } from '../dist/content/paths.js';
import { attachDataStoreInvalidation } from '../dist/content/vite-plugin-content-virtual-mod.js';
import { createMinimalSettings, createTempDir } from './units/content-layer/test-helpers.ts';
import { globalContentLayer } from '../dist/content/instance.js';
import { globalContentConfigObserver } from '../dist/content/utils.js';

process.env.ASTRO_TELEMETRY_DISABLED = 'true';

// Use an existing fixture's dependency resolution, but never edit its files or
// cache. Each run gets its own content, generated files, and optimizer cache.
it('does not queue a startup reload, but reloads on later content writes (#18568)', {
	timeout: 60_000,
}, async (t) => {
	const root = await mkdtemp(
		fileURLToPath(new URL('./fixtures/content-layer-dev-restart/startup-reload-', import.meta.url)),
	);
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(`${root}/src/content/blog`, { recursive: true });
	await mkdir(`${root}/src/pages`, { recursive: true });
	await writeFile(`${root}/package.json`, JSON.stringify({ type: 'module' }));
	await writeFile(`${root}/astro.config.mjs`, 'export default { devToolbar: { enabled: false } };');
	await writeFile(
		`${root}/src/content.config.ts`,
		`
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
export const collections = { blog: defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({ title: z.string() }),
}) };
`,
	);
	await writeFile(`${root}/src/content/blog/hello.md`, '---\ntitle: Original title\n---\nHello!\n');
	await writeFile(
		`${root}/src/pages/index.astro`,
		`---
import { getCollection } from 'astro:content';
const entries = await getCollection('blog');
---
<html><body>{entries.map(entry => <h1>{entry.data.title}</h1>)}</body></html>
`,
	);

	for (const start of ['fresh', 'warm']) {
		globalContentLayer.dispose();
		globalContentConfigObserver.set({ status: 'init' });
		const server = await dev({
			root,
			logLevel: 'silent',
			server: { host: '127.0.0.1', port: 0 },
			vite: { logLevel: 'silent' },
		});
		let socket: WebSocket | undefined;
		try {
			const origin = `http://127.0.0.1:${server.address.port}`;
			const client = await (await fetch(`${origin}/@vite/client`)).text();
			const token = /const wsToken = "([^"]+)"/.exec(client)?.[1];
			assert.ok(token, 'Vite HMR client should contain the websocket token');
			socket = new WebSocket(`${origin.replace('http:', 'ws:')}/?token=${token}`, 'vite-hmr');
			const messages: Array<{ type: string }> = [];
			socket.addEventListener('message', (event) => messages.push(JSON.parse(String(event.data))));
			await once(socket, 'open');
			const html = await (await fetch(origin)).text();
			assert.match(html, start === 'fresh' ? /Original title/ : /Edited fresh title/);
			await delay(1200); // Includes the store debounce and watcher-echo window.
			assert.ok(messages.some((message) => message.type === 'connected'));
			assert.equal(
				messages.filter((message) => message.type === 'full-reload').length,
				0,
				`${start} startup must not queue a client reload: ${JSON.stringify(messages)}`,
			);

			// No connected clients: preserve Vite's intentional buffering for a
			// runtime write while a browser is temporarily disconnected.
			socket.close();
			await once(socket, 'close');
			const store = globalContentLayer.get()!.store;
			store.set('blog', `runtime-${start}`, {
				id: `runtime-${start}`,
				data: { title: 'Runtime title' },
			});
			await store.waitUntilSaveComplete();
			await delay(200);
			socket = new WebSocket(`${origin.replace('http:', 'ws:')}/?token=${token}`, 'vite-hmr');
			const reconnectMessages: Array<{ type: string }> = [];
			socket.addEventListener('message', (event) =>
				reconnectMessages.push(JSON.parse(String(event.data))),
			);
			await once(socket, 'open');
			await delay(500);
			assert.equal(
				reconnectMessages.filter((message) => message.type === 'full-reload').length,
				1,
				'runtime writes still queue reloads for reconnecting clients',
			);
			const updated = await (await fetch(origin)).text();
			assert.match(updated, /Runtime title/);

			const reloadsBeforeEdit = reconnectMessages.filter(
				(message) => message.type === 'full-reload',
			).length;
			await writeFile(
				`${root}/src/content/blog/hello.md`,
				`---\ntitle: Edited ${start} title\n---\nChanged!\n`,
			);
			for (let attempt = 0; attempt < 50; attempt++) {
				if (
					reconnectMessages.filter((message) => message.type === 'full-reload').length >
					reloadsBeforeEdit
				)
					break;
				await delay(100);
			}
			assert.ok(
				reconnectMessages.filter((message) => message.type === 'full-reload').length >
					reloadsBeforeEdit,
				'a watched content edit must reload connected clients',
			);
			assert.match(await (await fetch(origin)).text(), new RegExp(`Edited ${start} title`));
		} finally {
			if (socket && socket.readyState !== WebSocket.CLOSED) {
				socket.close();
				await once(socket, 'close');
			}
			await server.stop();
			globalContentLayer.dispose();
		}
		// Keep generated .astro files for the warm-start control.
	}
});

// Exercise the invalidation helper against a real Vite middleware server with
// an external HTTP/HMR host. Astro's dev() API itself requires an HTTP server;
// this tests the reusable helper, not an unsupported dev({ middlewareMode }) API.
it('respects initial sync with a real null-httpServer middleware host (#18568)', {
	timeout: 20_000,
}, async (t) => {
	const root = createTempDir('content-startup-middleware-');
	t.after(() => rm(root, { recursive: true, force: true }));
	const settings = createMinimalSettings(root, { config: { legacy: {} } });
	const httpServer = createHttpServer((req, res) => server.middlewares(req, res));
	const server = await createViteServer({
		root: fileURLToPath(root),
		configFile: false,
		logLevel: 'silent',
		server: { middlewareMode: true, hmr: { server: httpServer } },
		environments: { ssr: {} },
	});
	t.after(async () => {
		await server.close();
		if (httpServer.listening)
			await new Promise<void>((resolve) => httpServer.close(() => resolve()));
	});
	assert.equal(server.httpServer, null);
	let initialSync = true;
	const store = await MutableDataStore.fromFile(getDataStoreFile(settings, true));
	attachDataStoreInvalidation(store, server, settings, { notifyClient: () => !initialSync });
	store.set('blog', 'initial', { id: 'initial' });
	await store.waitUntilSaveComplete();
	initialSync = false;

	httpServer.listen(0, '127.0.0.1');
	await once(httpServer, 'listening');
	const address = httpServer.address();
	assert.ok(address && typeof address === 'object');
	const origin = `http://127.0.0.1:${address.port}`;
	const client = await (await fetch(`${origin}/@vite/client`)).text();
	const token = /const wsToken = "([^"]+)"/.exec(client)?.[1];
	assert.ok(token);
	const socket = new WebSocket(`${origin.replace('http:', 'ws:')}/?token=${token}`, 'vite-hmr');
	t.after(async () => {
		if (socket.readyState !== WebSocket.CLOSED) {
			socket.close();
			await once(socket, 'close');
		}
	});
	const messages: Array<{ type: string }> = [];
	socket.addEventListener('message', (event) => messages.push(JSON.parse(String(event.data))));
	await once(socket, 'open');
	await delay(200);
	assert.equal(
		messages.filter((message) => message.type === 'full-reload').length,
		0,
		'initial sync must not buffer a reload in middleware mode',
	);
	store.set('blog', 'runtime', { id: 'runtime' });
	await store.waitUntilSaveComplete();
	for (
		let attempt = 0;
		attempt < 50 && !messages.some((message) => message.type === 'full-reload');
		attempt++
	)
		await delay(20);
	assert.equal(
		messages.filter((message) => message.type === 'full-reload').length,
		1,
		'runtime writes must still reload in middleware mode',
	);
});
