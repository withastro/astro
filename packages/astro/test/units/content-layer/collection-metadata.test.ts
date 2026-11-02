import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import { describe, it } from 'node:test';
import { getCollectionFiles } from '../../../dist/content/collection-files.js';
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
	function createContentLayer(
		root: URL,
		collectionMetadata: boolean,
		integrations: unknown[] = [],
	) {
		const settings = createMinimalSettings(root, {
			config: { experimental: { collectionMetadata }, integrations },
		});
		return new ContentLayer({
			settings,
			logger: defaultLogger,
			store: new MutableDataStore(),
			contentConfigObserver: createTestConfigObserver({
				docs: { type: 'content_layer', loader, descriptors: { audience: 'all' } },
				legacy: { type: 'content' },
			}),
		});
	}

	async function sync(root: URL, collectionMetadata: boolean) {
		await createContentLayer(root, collectionMetadata).sync();
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

	it('calls astro:collections:resolved once per content config', async () => {
		const calls: unknown[] = [];
		const integration = {
			name: 'collections-spy',
			hooks: {
				'astro:collections:resolved': ({ collections }: { collections: unknown[] }) => {
					calls.push(collections);
				},
			},
		};
		const contentLayer = createContentLayer(createTempDir(), true, [integration]);

		await contentLayer.sync();
		await contentLayer.sync();

		assert.equal(calls.length, 1);
		assert.deepEqual(calls[0], [
			{
				name: 'docs',
				type: 'build-time',
				loader: { name: 'docs-loader' },
				descriptors: { library: 'docs', version: 1, audience: 'all' },
			},
		]);
	});

	it('does not call astro:collections:resolved when the flag is disabled', async () => {
		let called = false;
		const integration = {
			name: 'collections-spy',
			hooks: { 'astro:collections:resolved': () => (called = true) },
		};

		await createContentLayer(createTempDir(), false, [integration]).sync();

		assert.equal(called, false);
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

describe('getCollectionFiles', () => {
	const docs = {
		name: 'docs',
		type: 'build-time',
		loader: { name: 'glob' },
		descriptors: {},
	} as const;
	const guides = { ...docs, name: 'guides' } as const;
	const entries: Record<string, Array<Record<string, unknown>>> = {
		docs: [
			{ id: 'intro', filePath: 'src/docs/intro.mdx', deferredRender: true },
			{ id: 'setup', filePath: 'src/docs/setup.md' },
			{ id: 'shared', filePath: 'src/shared/shared.mdx', deferredRender: true },
		],
		guides: [{ id: 'shared', filePath: 'src/shared/shared.mdx', deferredRender: true }],
	};

	it('maps the files of entries rendered as modules to their collection', () => {
		const files = getCollectionFiles([docs, guides], (name) => entries[name] as any);

		assert.deepEqual(files, { 'src/docs/intro.mdx': docs });
	});
});
