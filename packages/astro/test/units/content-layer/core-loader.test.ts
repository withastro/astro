import { strict as assert } from 'node:assert';
import { describe, it, before } from 'node:test';
import { z } from 'zod';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';

import { createTempDir, createTestConfigObserver, createMinimalSettings } from './test-helpers.js';

describe('Core Content Layer loader', () => {
	let logger;
	const root = createTempDir();

	before(() => {
		logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});
	});

	it('returns collection from a simple loader', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);

		// Create a simple loader
		const simpleLoader = () => [
			{ id: 'siamese', breed: 'Siamese' },
			{ id: 'tabby', breed: 'Tabby' },
		];

		// Define collections
		const collections = {
			cats: defineCollection({
				loader: simpleLoader,
				schema: z.object({
					id: z.string(),
					breed: z.string(),
				}),
			}),
		};

		// Create ContentLayer with test config
		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		// Sync content
		await contentLayer.sync();

		const entries = store.values('cats');
		assert.equal(entries.length, 2);
		assert.equal(entries[0].id, 'siamese');
		assert.equal(entries[1].id, 'tabby');
	});

	it('returns collection from a simple loader that uses an object', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);

		const objectLoader = () => ({
			capybara: {
				name: 'Capybara',
				scientificName: 'Hydrochoerus hydrochaeris',
				lifespan: 10,
				weight: 50000,
				diet: ['grass', 'aquatic plants', 'bark', 'fruits'],
				nocturnal: false,
			},
			hamster: {
				name: 'Golden Hamster',
				scientificName: 'Mesocricetus auratus',
				lifespan: 2,
				weight: 120,
				diet: ['seeds', 'nuts', 'insects'],
				nocturnal: true,
			},
		});

		// Define collections
		const collections = {
			rodents: defineCollection({
				loader: objectLoader,
				schema: z.object({
					name: z.string(),
					scientificName: z.string(),
					lifespan: z.number().int().positive(),
					weight: z.number().positive(),
					diet: z.array(z.string()),
					nocturnal: z.boolean(),
				}),
			}),
		};

		// Create ContentLayer with test config
		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		// Sync content
		await contentLayer.sync();

		const entries = store.values('rodents');
		assert.equal(entries.length, 2);

		const capybara = entries.find((e) => e.id === 'capybara');
		assert.ok(capybara);
		assert.equal(capybara.data.name, 'Capybara');
		assert.equal(capybara.data.weight, 50000);
	});

	it('can render markdown in loaders', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);

		const markdownContent = `
# heading 1
hello
## heading 2
![image](./image.png)
![image 2](https://example.com/image.png)
`;

		// Create a loader that renders markdown
		const markdownRenderingLoader = {
			name: 'markdown-rendering-loader',
			load: async (context) => {
				const result = await context.renderMarkdown(markdownContent, {
					fileURL: new URL('test.md', root),
				});

				const data = {
					lastValue: 1,
					lastUpdated: new Date(),
					// Store rendered content in data for this test
					renderedHtml: result.html,
					headingsCount: result.metadata.headings.length,
				};

				const parsed = await context.parseData({
					id: 'value',
					data,
				});

				await context.store.set({
					id: 'value',
					data: parsed,
				});
			},
		};

		// Define collections
		const collections = {
			increment: defineCollection({
				loader: markdownRenderingLoader,
				schema: z.object({
					lastValue: z.number(),
					lastUpdated: z.date(),
					renderedHtml: z.string(),
					headingsCount: z.number(),
				}),
			}),
		};

		// Create ContentLayer with test config
		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		// Sync content
		await contentLayer.sync();

		const entry = store.get('increment', 'value');
		assert.ok(entry);
		assert.ok(entry.data.renderedHtml);
		assert.ok(entry.data.renderedHtml.includes('<h1 id="heading-1">heading 1</h1>'));
		assert.ok(entry.data.renderedHtml.includes('<h2 id="heading-2">heading 2</h2>'));
		assert.equal(entry.data.headingsCount, 2);
	});

	it('stores Date objects', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const now = new Date();

		// Create a loader that returns Date objects
		const dateLoader = {
			name: 'date-loader',
			load: async (context) => {
				await context.store.set({
					id: 'test-date',
					data: {
						created: now,
						title: 'Test',
					},
				});
			},
		};

		// Define collections
		const collections = {
			dates: defineCollection({
				loader: dateLoader,
				schema: z.object({
					created: z.date(),
					title: z.string(),
				}),
			}),
		};

		// Create ContentLayer with test config
		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		// Sync content
		await contentLayer.sync();

		const entry = store.get('dates', 'test-date');
		assert.ok(entry);
		assert.ok(entry.data.created instanceof Date);
		assert.equal(entry.data.created.toISOString(), now.toISOString());
	});

	it('allows "slug" as a field', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);

		// Create a loader that uses slug field
		const slugLoader = {
			name: 'slug-loader',
			load: async (context) => {
				const data = {
					lastValue: 1,
					lastUpdated: new Date(),
					slug: 'slimy',
				};

				const parsed = await context.parseData({
					id: 'value',
					data,
				});

				await context.store.set({
					id: 'value',
					data: parsed,
				});
			},
		};

		// Define collections
		const collections = {
			increment: defineCollection({
				loader: slugLoader,
				schema: z.object({
					lastValue: z.number(),
					lastUpdated: z.date(),
					slug: z.string().optional(),
				}),
			}),
		};

		// Create ContentLayer with test config
		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		// Sync content
		await contentLayer.sync();

		const entry = store.get('increment', 'value');
		assert.ok(entry);
		assert.equal(entry.data.slug, 'slimy');
	});
});
