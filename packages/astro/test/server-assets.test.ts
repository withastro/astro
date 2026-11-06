import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Server assets (emitServerAsset)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/server-assets/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/server-assets/',
			cacheDir: './node_modules/.astro-test/server-assets/',
		});
		await fixture.build();
	});

	it('keeps server assets in the server output', () => {
		for (const file of ['server-only/data.txt', '_astro/server-only.txt']) {
			assert.ok(
				existsSync(new URL(`./dist/server-assets/server/${file}`, fixture.config.root)),
				`${file} is in the server output`,
			);
			assert.ok(
				!existsSync(new URL(`./dist/server-assets/client/${file}`, fixture.config.root)),
				`${file} is not in the client output`,
			);
		}
	});

	it('does not list server assets as static files', async () => {
		const app = await fixture.loadTestAdapterApp();
		for (const asset of app.manifest.assets) {
			assert.ok(!asset.includes('server-only'), `${asset} is not a client asset`);
		}
	});

	it('lets server code read them relative to itself', async () => {
		const app = await fixture.loadTestAdapterApp();
		for (const [file, contents] of [
			['server-only/data.txt', 'server-only data'],
			['_astro/server-only.txt', 'server-only data under _astro'],
		]) {
			const response = await app.render(
				new Request(`http://example.com/data?file=${encodeURIComponent(file)}`),
			);
			assert.equal(response.status, 200);
			assert.equal(await response.text(), contents);
		}
	});

	it('keeps a .wasm module imported by server code next to it', async () => {
		const app = await fixture.loadTestAdapterApp();
		const response = await app.render(new Request('http://example.com/wasm'));
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'true');
	});
});
