import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { astroCli, wranglerCli } from './_test-utils.js';

const root = new URL('./fixtures/module-loader/', import.meta.url);

describe('CloudflareModuleLoading', () => {
	let wrangler;
	before(async () => {
		await astroCli(fileURLToPath(root), 'build');

		wrangler = wranglerCli(fileURLToPath(root));
		await new Promise((resolve) => {
			wrangler.stdout.on('data', (data) => {
				// console.log('[stdout]', data.toString());
				if (data.toString().includes('http://127.0.0.1:8788')) resolve();
			});
			wrangler.stderr.on('data', (_data) => {
				// console.log('[stderr]', data.toString());
			});
		});
	});

	after((_done) => {
		wrangler.kill();
	});

	it('can render server side', async () => {
		const res = await fetch('http://127.0.0.1:8788/add/40/2');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 42 });
	});
	it('can render static', async () => {
		const res = await fetch('http://127.0.0.1:8788/hybrid');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 21 });
	});
	it('can render shared', async () => {
		const res = await fetch('http://127.0.0.1:8788/shared/40/2');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 42 });
	});
	it('can render static shared', async () => {
		const res = await fetch('http://127.0.0.1:8788/hybridshared');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 21 });
	});
	it('can render txt', async () => {
		const res = await fetch('http://127.0.0.1:8788/text');
		assert.equal(res.status, 200);
		const text = await res.text();
		assert.equal(text, 'Hello\n');
	});
	it('can render binary', async () => {
		const res = await fetch('http://127.0.0.1:8788/bin');
		assert.equal(res.status, 200);
		const text = zlib.gunzipSync(await res.arrayBuffer()).toString('utf-8');
		assert.equal(text, 'Hello\n');
	});
	it('can render compound paths', async () => {
		const res = await fetch('http://127.0.0.1:8788/compound');
		assert.equal(res.status, 200);
		const text = await res.text();
		assert.equal(text, 'Hello\n');
	});
});
