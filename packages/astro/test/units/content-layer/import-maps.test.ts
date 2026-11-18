import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { describe, it } from 'node:test';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { getModulesImportsFile } from '../../../dist/content/paths.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

function postsLoader(fileNames: Array<string>) {
	return {
		name: 'posts',
		load({ store }: any) {
			for (const fileName of fileNames) {
				store.set({
					id: fileName,
					data: {},
					filePath: `src/data/posts/${fileName}`,
					deferredRender: true,
				});
			}
		},
	};
}

async function syncPosts(settings: any, fileNames: Array<string>, isDev: boolean) {
	const contentLayer = new ContentLayer({
		settings,
		logger: new AstroLogger({ destination: { write: () => true }, level: 'silent' }),
		store: new MutableDataStore(),
		contentConfigObserver: createTestConfigObserver({
			posts: defineCollection({ loader: postsLoader(fileNames) }),
		}),
		isDev,
	});
	await contentLayer.sync();
}

describe('Content Layer - import maps', () => {
	it('keeps the dev module map when a production sync runs in the same project', async () => {
		const settings = createMinimalSettings(createTempDir());

		await syncPosts(settings, ['public.mdx', 'hidden.mdx'], true);
		await syncPosts(settings, ['public.mdx'], false);

		const devMap = await fs.readFile(getModulesImportsFile(settings, true), 'utf-8');
		const prodMap = await fs.readFile(getModulesImportsFile(settings, false), 'utf-8');
		assert.ok(devMap.includes('src/data/posts/hidden.mdx'));
		assert.ok(devMap.includes('src/data/posts/public.mdx'));
		assert.ok(!prodMap.includes('src/data/posts/hidden.mdx'));
		assert.ok(prodMap.includes('src/data/posts/public.mdx'));
	});
});
