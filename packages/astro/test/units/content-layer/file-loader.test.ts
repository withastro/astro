import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { file } from '../../../dist/content/loaders/file.js';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';
import { createTestConfigObserver, createMinimalSettings } from './test-helpers.js';

describe('File Loader', () => {
	const root = new URL('../../fixtures/content-layer/', import.meta.url);

	it('loads entries from JSON file', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const collections = {
			dogs: defineCollection({
				loader: file('src/data/dogs.json'),
				schema: z.object({
					breed: z.string(),
					id: z.string(),
					size: z.string(),
					origin: z.string(),
					lifespan: z.string(),
					temperament: z.array(z.string()),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check that entries were loaded
		const entries = store.values('dogs');
		assert.equal(entries.length, 25);

		// Check a specific entry
		const beagle = entries.find((e) => e.id === 'beagle');
		assert.ok(beagle);
		assert.equal(beagle.data.breed, 'Beagle');
		assert.deepEqual(beagle.data.temperament, ['Friendly', 'Curious', 'Merry']);
		assert.equal(beagle.filePath, 'src/data/dogs.json');
	});

	it('loads entries from YAML file', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const collections = {
			fish: defineCollection({
				loader: file('src/data/fish.yaml'),
				schema: z.object({
					name: z.string(),
					breed: z.string(),
					age: z.number(),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('fish');
		assert.equal(entries.length, 10);

		const nemo = entries.find((e) => e.id === 'nemo');
		assert.ok(nemo);
		assert.equal(nemo.data.name, 'Nemo');
		assert.equal(nemo.data.breed, 'Clownfish');
		assert.equal(nemo.data.age, 3);
	});

	it('loads entries from TOML file', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const collections = {
			songs: defineCollection({
				loader: file('src/data/songs.toml'),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('songs');
		assert.equal(entries.length, 8);

		// Songs have 'name' and 'artists' fields
		const crown = entries.find((e) => e.id === 'crown');
		assert.ok(crown);
		assert.equal(crown.data.name, 'Crown');
	});

	it('loads entries from CSV file with custom parser', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const collections = {
			plants: defineCollection({
				loader: file('src/data/plants.csv', {
					parser: (text) => {
						const [headers, ...rows] = text.trim().split('\n');
						return rows.map((row) =>
							Object.fromEntries(headers.split(',').map((h, i) => [h, row.split(',')[i]])),
						);
					},
				}),
				schema: z.object({
					id: z.string(),
					common_name: z.string(),
					scientific_name: z.string(),
					color: z.string(),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('plants');
		assert.equal(entries.length, 10);

		const rose = entries.find((e) => e.id === 'rose');
		assert.ok(rose);
		assert.equal(rose.data.common_name, 'Rose');
		assert.equal(rose.data.scientific_name, 'Rosa');
		assert.equal(rose.data.color, 'Red');
	});

	it('loads nested JSON with custom parser', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const collections = {
			birds: defineCollection({
				loader: file('src/data/birds.json', {
					parser: (text) => JSON.parse(text).birds,
				}),
				schema: z.object({
					id: z.string(),
					name: z.string(),
					breed: z.string(),
					age: z.number(),
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('birds');
		assert.equal(entries.length, 5);

		const bluejay = entries.find((e) => e.id === 'bluejay');
		assert.ok(bluejay);
		assert.equal(bluejay.data.name, 'Blue Jay');
		assert.equal(bluejay.data.breed, 'Cyanocitta cristata');
		assert.equal(bluejay.data.age, 3);
	});

	it('uses async parser', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const collections = {
			birdsAsync: defineCollection({
				loader: file('src/data/birds.json', {
					parser: async (text) => {
						// Simulate async work
						await new Promise((resolve) => setTimeout(resolve, 10));
						return JSON.parse(text).birds;
					},
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('birdsAsync');
		assert.equal(entries.length, 5);
	});

	it('warns on duplicate IDs', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);

		// Create a custom logger to capture warnings
		const warnings = [];
		const logger = new Logger({
			dest: {
				write: (msg) => {
					if (msg.level === 'warn') {
						warnings.push(msg.message);
					}
					return true;
				},
			},
			level: 'info',
		});

		const collections = {
			dogsWithDupes: defineCollection({
				loader: file('src/data/dogs.json', {
					parser: () => [
						{ id: 'beagle', breed: 'Beagle 1' },
						{ id: 'beagle', breed: 'Beagle 2' },
					],
				}),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check that a warning was logged
		assert.ok(warnings.some((w) => w.includes('Duplicate id "beagle"')));

		// Check that the last entry won
		const entries = store.values('dogsWithDupes');
		assert.equal(entries.length, 1);
		assert.equal(entries[0].data.breed, 'Beagle 2');
	});
});
