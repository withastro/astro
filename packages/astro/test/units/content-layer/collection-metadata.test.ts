import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import { describe, it } from 'node:test';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { getCollectionsMetadata } from '../../../dist/content/metadata.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { astroContentVirtualModPlugin } from '../../../dist/content/vite-plugin-content-virtual-mod.js';
import { defaultLogger } from '../test-utils.ts';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

const loader = {
	name: 'docs-loader',
	load: async () => {},
	descriptors: { library: 'docs', version: 1 },
};

describe('getCollectionsMetadata', () => {
	it('merges the descriptors of the loader and the collection', () => {
		const metadata = getCollectionsMetadata(
			{
				docs: { type: 'content_layer', loader },
				guides: { type: 'content_layer', loader, descriptors: { version: 2 } },
			},
			'build-time',
		);

		assert.deepEqual(metadata, [
			{
				name: 'docs',
				type: 'build-time',
				loader: { name: 'docs-loader' },
				descriptors: { library: 'docs', version: 1 },
			},
			{
				name: 'guides',
				type: 'build-time',
				loader: { name: 'docs-loader' },
				descriptors: { library: 'docs', version: 2 },
			},
		]);
	});

	it('names inline loaders', () => {
		const [metadata] = getCollectionsMetadata(
			{ authors: { type: 'content_layer', loader: () => [] } },
			'build-time',
		);

		assert.deepEqual(metadata.loader, { name: 'inline' });
		assert.deepEqual(metadata.descriptors, {});
	});
});

describe('ContentLayer with collection metadata', () => {
	async function sync(root: URL, collectionMetadata: boolean) {
		const settings = createMinimalSettings(root, {
			config: { experimental: { collectionMetadata } },
		});
		const contentLayer = new ContentLayer({
			settings,
			logger: defaultLogger,
			store: new MutableDataStore(),
			contentConfigObserver: createTestConfigObserver({
				docs: { type: 'content_layer', loader, descriptors: { audience: 'all' } },
				legacy: { type: 'content' },
			}),
		});
		await contentLayer.sync();
		return new URL('./.astro/collections-metadata.json', root);
	}

	it('writes the metadata of build-time collections', async () => {
		const file = await sync(createTempDir(), true);

		assert.deepEqual(JSON.parse(nodeFs.readFileSync(file, 'utf-8')), [
			{
				name: 'docs',
				type: 'build-time',
				loader: { name: 'docs-loader' },
				descriptors: { library: 'docs', version: 1, audience: 'all' },
			},
		]);
	});

	it('removes the metadata when the flag is disabled', async () => {
		const root = createTempDir();
		await sync(root, true);
		const file = await sync(root, false);

		assert.equal(nodeFs.existsSync(file), false);
	});
});

describe('collections metadata module', () => {
	async function load(root: URL, collectionMetadata: boolean) {
		const settings = createMinimalSettings(root, {
			config: { experimental: { collectionMetadata }, legacy: {} },
		});
		const plugin: any = astroContentVirtualModPlugin({ settings, fs: nodeFs });
		plugin.config?.({}, { command: 'build' });
		return (await plugin.load.handler.call({}, '\0astro:collections-metadata')).code;
	}

	it('exports the metadata written by the last sync', async () => {
		const root = createTempDir();
		await nodeFs.promises.mkdir(new URL('./.astro/', root), { recursive: true });
		await nodeFs.promises.writeFile(
			new URL('./.astro/collections-metadata.json', root),
			JSON.stringify([{ name: 'docs' }]),
		);

		const code = await load(root, true);

		assert.match(code, /export const enabled = true;/);
		assert.match(code, /export const collections = \[\{"name":"docs"\}\];/);
	});

	it('exports no collections without metadata', async () => {
		const code = await load(createTempDir(), false);

		assert.match(code, /export const enabled = false;/);
		assert.match(code, /export const collections = \[\];/);
	});
});
