import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { reloadContentConfigObserver } from '../../../dist/content/utils.js';
import { defaultLogger } from '../test-utils.ts';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

async function loadConfig(
	collections: Record<string, unknown>,
	{ collectionStorageDrivers = true } = {},
) {
	const root = createTempDir();
	const settings = createMinimalSettings(root, {
		config: { experimental: { collectionStorageDrivers } },
	});
	fs.mkdirSync(settings.config.srcDir, { recursive: true });
	fs.writeFileSync(new URL('./content.config.mjs', settings.config.srcDir), '');

	let loaded: any;
	const observer = createTestConfigObserver({});
	observer.set = (ctx: any) => {
		loaded = ctx;
	};
	// The config file is only read for its digest; its exports come from the runner.
	const environment: any = { runner: { import: async () => ({ collections }) } };

	await reloadContentConfigObserver({ fs, settings, environment, observer, logger: defaultLogger });
	return loaded;
}

function collectionWithStorage(storage: unknown) {
	return {
		type: 'content_layer',
		loader: { name: 'docs-loader', load: async () => {} },
		storage,
	};
}

describe('collection storage in the content config', () => {
	it('keeps the storage descriptor of a collection', async () => {
		const storage = { entrypoint: 'my-driver', config: { url: 'libsql://example.turso.io' } };
		const ctx = await loadConfig({ docs: collectionWithStorage(storage) });

		assert.equal(ctx.status, 'loaded');
		assert.deepEqual(ctx.config.collections.docs.storage, storage);
	});

	it('accepts a URL entrypoint and a descriptor without config', async () => {
		const entrypoint = new URL('file:///project/driver.mjs');
		const ctx = await loadConfig({ docs: collectionWithStorage({ entrypoint }) });

		assert.equal(ctx.status, 'loaded');
		assert.equal(ctx.config.collections.docs.storage.entrypoint, entrypoint);
	});

	it('throws when the flag is disabled', async () => {
		const ctx = await loadConfig(
			{ docs: collectionWithStorage({ entrypoint: 'my-driver' }) },
			{ collectionStorageDrivers: false },
		);

		assert.equal(ctx.status, 'error');
		assert.equal(ctx.error.name, 'CollectionStorageDriversNotEnabled');
		assert.match(ctx.error.message, /`docs`/);
	});

	it('accepts collections without storage when the flag is disabled', async () => {
		const ctx = await loadConfig(
			{ docs: collectionWithStorage(undefined) },
			{ collectionStorageDrivers: false },
		);

		assert.equal(ctx.status, 'loaded');
	});
});
