import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { createStaticHandler } from '../../dist/serve-static.js';

// Mirrors the `dist/client` output of `build.format: 'file'` for `blog.astro`,
// `blog/[slug].astro` and `v1.2.astro` (#18835).
function createClientDir() {
	const clientDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-node-file-format-'));
	fs.mkdirSync(path.join(clientDir, 'blog'));
	fs.writeFileSync(path.join(clientDir, 'blog.html'), 'blog');
	fs.writeFileSync(path.join(clientDir, 'blog', 'one.html'), 'one');
	fs.writeFileSync(path.join(clientDir, 'v1.2.html'), 'v1.2');
	return clientDir;
}

async function startStaticServer(clientDir: string, trailingSlash: string) {
	const app = {
		removeBase: (p: string) => p,
		match: () => undefined,
		manifest: { trailingSlash, buildFormat: 'file', assetsDir: '_astro' },
	};
	// `resolveClientDir` locates the client folder relative to the folder named like
	// `options.server`, which is `dist/` here.
	const server_ = new URL('../../dist/', import.meta.url).href;
	const client = pathToFileURL(clientDir + path.sep).href;
	const handler = createStaticHandler(
		app as any,
		{ client, server: server_, port: 0 } as any,
		undefined,
	);
	const server = http.createServer((req, res) => {
		handler(req, res, () => {
			res.statusCode = 404;
			res.end('ssr');
		});
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	return { server, port: (server.address() as AddressInfo).port };
}

async function get(port: number, pathname: string) {
	const res = await fetch(`http://127.0.0.1:${port}${pathname}`, { redirect: 'manual' });
	return { status: res.status, body: await res.text() };
}

describe('createStaticHandler with build.format: file', () => {
	let clientDir: string;

	before(() => {
		clientDir = createClientDir();
	});

	after(() => {
		fs.rmSync(clientDir, { recursive: true, force: true });
	});

	describe('trailingSlash: never', () => {
		let server: http.Server;
		let port: number;

		before(async () => {
			({ server, port } = await startStaticServer(clientDir, 'never'));
		});

		after(() => {
			server.close();
		});

		it('serves a page whose name matches a folder', async () => {
			assert.deepEqual(await get(port, '/blog'), { status: 200, body: 'blog' });
		});

		it('serves a page inside that folder', async () => {
			assert.deepEqual(await get(port, '/blog/one'), { status: 200, body: 'one' });
		});

		it('serves a page with a dot in its name', async () => {
			assert.deepEqual(await get(port, '/v1.2'), { status: 200, body: 'v1.2' });
		});
	});

	describe('trailingSlash: ignore', () => {
		let server: http.Server;
		let port: number;

		before(async () => {
			({ server, port } = await startStaticServer(clientDir, 'ignore'));
		});

		after(() => {
			server.close();
		});

		it('serves a page whose name matches a folder, with or without a trailing slash', async () => {
			assert.deepEqual(await get(port, '/blog'), { status: 200, body: 'blog' });
			assert.deepEqual(await get(port, '/blog/'), { status: 200, body: 'blog' });
		});

		it('serves a page with a trailing slash', async () => {
			assert.deepEqual(await get(port, '/blog/one/'), { status: 200, body: 'one' });
			assert.deepEqual(await get(port, '/v1.2/'), { status: 200, body: 'v1.2' });
		});

		it('falls through to SSR for a missing page', async () => {
			assert.deepEqual(await get(port, '/missing/'), { status: 404, body: 'ssr' });
		});
	});

	describe('trailingSlash: always', () => {
		let server: http.Server;
		let port: number;

		before(async () => {
			({ server, port } = await startStaticServer(clientDir, 'always'));
		});

		after(() => {
			server.close();
		});

		it('serves pages with a trailing slash', async () => {
			assert.deepEqual(await get(port, '/blog/'), { status: 200, body: 'blog' });
			assert.deepEqual(await get(port, '/blog/one/'), { status: 200, body: 'one' });
		});
	});
});
