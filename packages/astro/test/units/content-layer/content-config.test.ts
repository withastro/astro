import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { externalFile, externalGlob } from '../../../dist/content/loaders/index.js';
import { reloadContentConfigObserver } from '../../../dist/content/utils.js';
import { defaultLogger } from '../test-utils.ts';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

async function loadConfig(collections: Record<string, unknown>) {
	const root = createTempDir();
	const settings = createMinimalSettings(root);
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

describe('content config parsing', () => {
	it('keeps the collection storage and the loader external storage support', async () => {
		const ctx = await loadConfig({
			posts: {
				type: 'content_layer',
				storage: 'external',
				loader: { name: 'posts-loader', load: async () => {}, supportsExternalStorage: true },
			},
		});

		assert.equal(ctx.status, 'loaded');
		assert.equal(ctx.config.collections.posts.storage, 'external');
		assert.equal(ctx.config.collections.posts.loader.supportsExternalStorage, true);
	});

	it('keeps the external storage support of the built-in external loaders', async () => {
		const ctx = await loadConfig({
			posts: { type: 'content_layer', storage: 'external', loader: externalGlob({ pattern: '*' }) },
			data: { type: 'content_layer', storage: 'external', loader: externalFile('data.json') },
		});

		assert.equal(ctx.status, 'loaded');
		assert.equal(ctx.config.collections.posts.loader.supportsExternalStorage, true);
		assert.equal(ctx.config.collections.data.loader.supportsExternalStorage, true);
	});

	it('rejects an unknown collection storage', async () => {
		const ctx = await loadConfig({
			posts: {
				type: 'content_layer',
				storage: 'remote',
				loader: { name: 'posts-loader', load: async () => {} },
			},
		});

		assert.equal(ctx.status, 'does-not-exist');
	});
});
