import { strict as assert } from 'node:assert';
import { EventEmitter } from 'node:events';
import { describe, it, before } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';

import { createTempDir, createTestConfigObserver, createMinimalSettings } from './test-helpers.ts';

describe('Content Layer rewatch', () => {
	let logger: any;
	const root = createTempDir();

	before(() => {
		logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});
	});

	function createWatcher(): any {
		return new EventEmitter();
	}

	function createContentLayer({ watcher, loadDelay = 0 }: { watcher?: any; loadDelay?: number }) {
		const loads = { started: 0, running: 0, maxRunning: 0 };
		const collections = {
			posts: defineCollection({
				loader: {
					name: 'watching-loader',
					load: async ({ watcher: loaderWatcher }: any) => {
						loads.started++;
						loads.running++;
						loads.maxRunning = Math.max(loads.maxRunning, loads.running);
						await delay(loadDelay);
						loaderWatcher?.on('change', () => {});
						loads.running--;
					},
				},
			}),
		};
		const contentLayer = new ContentLayer({
			settings: createMinimalSettings(root),
			logger,
			store: new MutableDataStore(),
			watcher,
			contentConfigObserver: createTestConfigObserver(collections),
		});
		return { contentLayer, loads };
	}

	it('moves loader subscriptions to the new watcher and re-syncs', async () => {
		const oldWatcher = createWatcher();
		const newWatcher = createWatcher();
		const { contentLayer, loads } = createContentLayer({ watcher: oldWatcher });
		await contentLayer.sync();

		await contentLayer.rewatch({ settings: createMinimalSettings(root), watcher: newWatcher });

		assert.equal(loads.started, 2);
		assert.equal(oldWatcher.listenerCount('change'), 0);
		assert.equal(newWatcher.listenerCount('change'), 1);
	});

	it('waits for a sync in progress', async () => {
		const { contentLayer, loads } = createContentLayer({
			watcher: createWatcher(),
			loadDelay: 20,
		});

		await Promise.all([
			contentLayer.sync(),
			contentLayer.rewatch({ settings: createMinimalSettings(root), watcher: createWatcher() }),
		]);

		assert.equal(loads.started, 2);
		assert.equal(loads.maxRunning, 1);
	});

	it('does nothing when not watching', async () => {
		const newWatcher = createWatcher();
		const { contentLayer, loads } = createContentLayer({});
		await contentLayer.sync();

		await contentLayer.rewatch({ settings: createMinimalSettings(root), watcher: newWatcher });

		assert.equal(loads.started, 1);
		assert.equal(newWatcher.listenerCount('change'), 0);
	});
});
