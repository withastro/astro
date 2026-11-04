import { once } from 'node:events';
import { rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { expect, test } from '@playwright/test';
import { globalContentLayer } from '../dist/content/instance.js';
import { globalContentConfigObserver } from '../dist/content/utils.js';
import { dev } from '../dist/core/index.js';
import { createContentStartupFixture } from '../test/test-utils-content-startup.ts';

let root: string;
let devServer: Awaited<ReturnType<typeof dev>>;
let origin: string;

test.beforeAll(async () => {
	root = await createContentStartupFixture();
	globalContentLayer.dispose();
	globalContentConfigObserver.set({ status: 'init' });
	devServer = await dev({
		root,
		logLevel: 'silent',
		server: { host: '127.0.0.1', port: 0 },
		vite: { logLevel: 'silent' },
	});
	origin = `http://127.0.0.1:${devServer.address.port}/`;
});

test.afterAll(async () => {
	await devServer?.stop();
	globalContentLayer.dispose();
	if (root) await rm(root, { recursive: true, force: true });
});

test('queues runtime content reloads before the first HMR connection (#18568)', async ({
	page,
}) => {
	// Consume any earlier buffered message so only the runtime write below can
	// cause a reload. The server must have no connected clients during the write.
	const client = await (await fetch(new URL('/@vite/client', origin))).text();
	const token = /const wsToken = "([^"]+)"/.exec(client)?.[1];
	expect(token).toBeTruthy();
	const websocketUrl = new URL(origin);
	websocketUrl.protocol = websocketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
	websocketUrl.searchParams.set('token', token!);
	const drain = new WebSocket(websocketUrl, 'vite-hmr');
	try {
		await once(drain, 'open');
		await delay(200);
	} finally {
		drain.close();
		await once(drain, 'close');
	}

	let allowConnect!: () => void;
	const gate = new Promise<void>((resolve) => {
		allowConnect = resolve;
	});
	let markIntercepted!: () => void;
	const intercepted = new Promise<void>((resolve) => {
		markIntercepted = resolve;
	});
	await page.routeWebSocket('**', async (websocket) => {
		markIntercepted();
		await gate;
		websocket.connectToServer();
	});

	try {
		const navigation = page.goto(origin, { waitUntil: 'domcontentloaded' });
		await expect(page.locator('body > h2')).toHaveText('Original title');
		await intercepted;
		const store = globalContentLayer.get()!.store;
		store.set('blog', 'runtime', { id: 'runtime', data: { title: 'Runtime title' } });
		await store.waitUntilSaveComplete();

		allowConnect();
		await navigation;
		await expect(page.locator('body > h2')).toHaveText(['Original title', 'Runtime title']);
	} finally {
		allowConnect();
	}
});
