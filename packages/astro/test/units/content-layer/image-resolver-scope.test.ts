import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as z from 'zod/v4';
import { fileURLToPath } from 'node:url';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { image } from '../../../dist/content/image.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { createMinimalSettings, createTempDir, createTestConfigObserver } from './test-helpers.ts';

const imagePath = fileURLToPath(new URL('../assets/600x400.jpg', import.meta.url));
const entryFilePath = '/content/post.md';

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}

function createViteServer(source: string, calls: string[]) {
	return {
		environments: {
			ssr: {
				pluginContainer: {
					resolveId: async (resolvedSource: string) => {
						calls.push(resolvedSource);
						return resolvedSource === source ? { id: imagePath } : null;
					},
				},
			},
		},
	};
}

function createLayer(load: (context: any) => Promise<void>, viteServer: any) {
	return new ContentLayer({
		settings: createMinimalSettings(createTempDir()),
		logger: new AstroLogger({ destination: { write: () => true }, level: 'silent' }),
		store: new MutableDataStore(),
		contentConfigObserver: createTestConfigObserver({
			posts: defineCollection({
				schema: (context) =>
					z.object({
						cover: z.string().transform((src) => image(context, { src })),
					}),
				loader: { name: 'test', load },
			}),
		}),
		viteServer,
	});
}

describe('Content Layer image resolver scope', () => {
	it('uses each overlapping sync’s own Vite resolver', async () => {
		const firstSource = '@first/cover.jpg';
		const secondSource = '@second/cover.jpg';
		const firstCalls: string[] = [];
		const secondCalls: string[] = [];
		const bothLoadersStarted = deferred();
		const continueLoading = deferred();
		let loaderCount = 0;
		let firstData: any;
		let secondData: any;

		const load = (source: string, save: (data: any) => void) => async (context: any) => {
			loaderCount++;
			if (loaderCount === 2) {
				bothLoadersStarted.resolve();
			}
			await continueLoading.promise;
			save(
				await context.parseData({
					id: 'post',
					data: { cover: source },
					filePath: entryFilePath,
				}),
			);
		};

		const first = createLayer(
			load(firstSource, (data) => (firstData = data)),
			createViteServer(firstSource, firstCalls),
		);
		const second = createLayer(
			load(secondSource, (data) => (secondData = data)),
			createViteServer(secondSource, secondCalls),
		);

		const firstSync = first.sync();
		const secondSync = second.sync();
		await bothLoadersStarted.promise;
		continueLoading.resolve();
		await Promise.all([firstSync, secondSync]);

		assert.deepEqual(firstCalls, [firstSource]);
		assert.deepEqual(secondCalls, [secondSource]);
		assert.equal(firstData.cover.width, 600);
		assert.equal(secondData.cover.width, 600);
	});
});
