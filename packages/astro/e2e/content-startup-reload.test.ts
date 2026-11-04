import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { expect } from '@playwright/test';
import { globalContentLayer } from '../dist/content/instance.js';
import { type DevServer, testFactory } from './test-utils.ts';

// This dev-only fixture is in the same package and needs no framework dependencies.
const test = testFactory(import.meta.url, {
	root: '../test/fixtures/content-layer-dev-restart/',
	devToolbar: { enabled: false },
});
let devServer: DevServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer?.stop();
});

test('queues runtime content reloads before the first HMR connection (#18568)', async ({
	page,
	astro,
}) => {
	// Consume any earlier buffered message so only the runtime write below can
	// cause a reload. The server must have no connected clients during the write.
	const origin = astro.resolveUrl('/');
	const client = await (await astro.fetch('/@vite/client')).text();
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
