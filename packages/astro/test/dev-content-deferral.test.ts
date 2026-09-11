import * as assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

const fixtureDir = fileURLToPath(new URL('./fixtures/dev-content-deferral/', import.meta.url));
const astroDir = path.join(fixtureDir, '.astro');
const markerPath = path.join(fixtureDir, 'server-started.txt');
const storePath = path.join(astroDir, 'data-store.json');
const configPath = path.join(fixtureDir, 'astro.config.mjs');
const originalConfig = fs.readFileSync(configPath, 'utf-8');

function resetFixture() {
	fs.rmSync(astroDir, { recursive: true, force: true });
	fs.rmSync(markerPath, { force: true });
}

let fixture: Fixture;

function startDev() {
	return fixture.startDevServer({ logLevel: 'silent' });
}

async function fetchPage(_devServer: DevServer, pathname = '/') {
	return fixture.fetch(pathname);
}

async function waitForContent(devServer: DevServer, timeoutMs = 8000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetchPage(devServer);
			if (res.status === 200 && (await res.text()).includes('Hello world')) {
				return;
			}
		} catch {
			// An in-place restart briefly closes the HTTP server before binding the same port.
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	throw new Error('Page did not serve synced content within timeout');
}

async function waitForRestart(devServer: DevServer, previousWatcher: DevServer['watcher']) {
	const deadline = Date.now() + 8000;
	while (Date.now() < deadline) {
		if (devServer.watcher !== previousWatcher) return;
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error('Dev server did not restart within timeout');
}

describe('dev content deferral', () => {
	let devServer: DevServer | undefined;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/dev-content-deferral/' });
	});

	beforeEach(() => {
		fs.writeFileSync(configPath, originalConfig);
		resetFixture();
	});

	afterEach(async () => {
		await devServer?.stop().catch(() => {});
		devServer = undefined;
		fs.writeFileSync(configPath, originalConfig);
		resetFixture();
	});

	it('serves fully synced content on the first request after start (fresh store)', async () => {
		devServer = await startDev();
		// Content setup runs after the port is listening: the server:start hook
		// must have run, but the deferred sync must not have written the store yet.
		assert.equal(
			fs.existsSync(markerPath),
			true,
			'astro:server:start should run before content readiness',
		);
		assert.equal(
			fs.existsSync(storePath),
			false,
			'content sync should still be in flight right after dev() resolves',
		);

		const staticResponse = await fetchPage(devServer, '/static.txt');
		assert.equal(await staticResponse.text(), 'static content\n');
		assert.equal(
			fs.existsSync(storePath),
			false,
			'Vite static requests should not wait for content readiness',
		);

		// The request gate holds until the deferred chain settles, so the first
		// request must never observe an empty store.
		const res = await fetchPage(devServer);
		assert.equal(res.status, 200);
		const body = await res.text();
		assert.match(body, /Hello world/);
		assert.match(body, /Second post/);
		assert.equal(fs.existsSync(storePath), true, 'sync should have written the store once served');
	});

	it('stops cleanly when no request was ever made, repeatedly', async () => {
		for (let i = 0; i < 3; i++) {
			const server = await startDev();
			await server.stop();
		}
	});

	it('keeps serving correct content across an in-place astro.config restart', async () => {
		devServer = await startDev();
		await waitForContent(devServer);

		const previousWatcher = devServer.watcher;
		fs.writeFileSync(configPath, originalConfig + '\n// restart marker\n');

		await waitForRestart(devServer, previousWatcher);
		await waitForContent(devServer);
		const res = await fetchPage(devServer);
		assert.equal(res.status, 200);
		assert.match(await res.text(), /Hello world/);
	});

	it('keeps the server alive when the content config is broken', async () => {
		resetFixture();
		const configFile = path.join(fixtureDir, 'src/content.config.ts');
		const original = fs.readFileSync(configFile, 'utf-8');
		try {
			fs.writeFileSync(configFile, 'export const broken = ;');
			devServer = await startDev();
			// A broken content config must not hang the request gate: the page is
			// served (empty store) and the error is logged, matching the behavior
			// when content setup ran on the ready path.
			const res = await fetchPage(devServer);
			assert.equal(res.status, 200);
		} finally {
			await devServer?.stop();
			devServer = undefined;
			fs.writeFileSync(configFile, original);
		}
	});
});
