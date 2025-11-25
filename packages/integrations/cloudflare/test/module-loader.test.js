import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import zlib from 'node:zlib';
import { loadFixture } from './_test-utils.js';

describe('CloudflareModuleLoading', 	{ skip: 'Requires the preview server', todo: 'Enable once the preview server is supported' },
	() => {
	let fixture;
	let previewServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/module-loader/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});
	
	after(async () => {
		await previewServer.stop();
	})

	it('can render server side', async () => {
		const res = await fixture.fetch('/add/40/2');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 42 });
	});
	it('can render static', async () => {
		const res = await fixture.fetch('/hybrid');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 21 });
	});
	it('can render shared', async () => {
		const res = await fixture.fetch('/shared/40/2');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 42 });
	});
	it('can render static shared', async () => {
		const res = await fixture.fetch('/hybridshared');
		assert.equal(res.status, 200);
		const json = await res.json();
		assert.deepEqual(json, { answer: 21 });
	});
	it('can render txt', async () => {
		const res = await fixture.fetch('/text');
		assert.equal(res.status, 200);
		const text = await res.text();
		assert.equal(text, 'Hello\n');
	});
	it('can render binary', async () => {
		const res = await fixture.fetch('/bin');
		assert.equal(res.status, 200);
		const text = zlib.gunzipSync(await res.arrayBuffer()).toString('utf-8');
		assert.equal(text, 'Hello\n');
	});
	it('can render compound paths', async () => {
		const res = await fixture.fetch('/compound');
		assert.equal(res.status, 200);
		const text = await res.text();
		assert.equal(text, 'Hello\n');
	});
});
