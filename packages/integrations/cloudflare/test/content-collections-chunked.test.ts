import * as assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('Chunked collection storage', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/content-collections-chunked/',
			outDir: './dist/chunked/',
			adapter: cloudflare(),
			output: 'server',
			experimental: { collectionStorage: 'chunked' },
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('loads a multi-chunk entry in workerd development', async () => {
		const manifest = JSON.parse(
			await readFile(new URL('./.astro/data-store/manifest.json', fixture.config.root), 'utf-8'),
		) as Record<string, string[]>;
		assert.ok(new Set(manifest.generated).size > 1);

		const response = await fixture.fetch('/');
		assert.equal(response.status, 200);
	});
});
