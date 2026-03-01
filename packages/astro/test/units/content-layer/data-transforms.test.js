import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineCollection } from '../../../dist/content/config.js';
import { createReference } from '../../../dist/content/runtime.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';
import { createTempDir, createTestConfigObserver, createMinimalSettings } from './test-helpers.js';

describe('Content Layer - Data Transforms', () => {
	const root = createTempDir();
	const reference = createReference();

	it('transforms reference strings to reference objects', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Create a loader that returns data with reference strings
		const dogsLoader = {
			name: 'dogs-loader',
			load: async (context) => {
				const data = {
					id: 'beagle',
					name: 'Beagle Dog',
					favoriteCat: 'tabby',
				};

				const parsed = await context.parseData({
					id: 'beagle',
					data,
				});

				await context.store.set({
					id: 'beagle',
					data: parsed,
				});
			},
		};

		const collections = {
			dogs: defineCollection({
				loader: dogsLoader,
				schema: z.object({
					id: z.string(),
					name: z.string(),
					favoriteCat: reference('cats'),
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

		const result = store.get('dogs', 'beagle');
		assert.ok(result);
		assert.equal(result.data.id, 'beagle');
		assert.equal(result.data.name, 'Beagle Dog');
		assert.deepEqual(result.data.favoriteCat, { collection: 'cats', id: 'tabby' });
	});

	it('transforms dates correctly', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const eventsLoader = {
			name: 'events-loader',
			load: async (context) => {
				const data = {
					id: 'event1',
					title: 'Launch Event',
					publishedDate: '2024-07-20',
					eventTime: '2024-07-20T10:00:00Z',
				};

				const parsed = await context.parseData({
					id: 'event1',
					data,
				});

				await context.store.set({
					id: 'event1',
					data: parsed,
				});
			},
		};

		const collections = {
			events: defineCollection({
				loader: eventsLoader,
				schema: z.object({
					id: z.string(),
					title: z.string(),
					publishedDate: z.coerce.date(),
					eventTime: z.coerce.date(),
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

		const result = store.get('events', 'event1');
		assert.ok(result);
		assert.ok(result.data.publishedDate instanceof Date);
		assert.ok(result.data.eventTime instanceof Date);
		assert.equal(result.data.publishedDate.toISOString().split('T')[0], '2024-07-20');
		assert.equal(result.data.eventTime.toISOString(), '2024-07-20T10:00:00.000Z');
	});

	it('applies schema defaults', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const productsLoader = {
			name: 'products-loader',
			load: async (context) => {
				const data = {
					id: 'product1',
					name: 'Basic Product',
					// Missing inStock, category, and tags - should use defaults
				};

				const parsed = await context.parseData({
					id: 'product1',
					data,
				});

				await context.store.set({
					id: 'product1',
					data: parsed,
				});
			},
		};

		const collections = {
			products: defineCollection({
				loader: productsLoader,
				schema: z.object({
					id: z.string(),
					name: z.string(),
					inStock: z.boolean().default(false),
					category: z.string().default('uncategorized'),
					tags: z.array(z.string()).default([]),
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

		const result = store.get('products', 'product1');
		assert.ok(result);
		assert.equal(result.data.inStock, false);
		assert.equal(result.data.category, 'uncategorized');
		assert.deepEqual(result.data.tags, []);
	});

	it('handles array of references', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const teamsLoader = {
			name: 'teams-loader',
			load: async (context) => {
				const data = {
					id: 'team1',
					name: 'Rocket Team',
					members: ['john', 'jane', 'bob'],
				};

				const parsed = await context.parseData({
					id: 'team1',
					data,
				});

				await context.store.set({
					id: 'team1',
					data: parsed,
				});
			},
		};

		const collections = {
			teams: defineCollection({
				loader: teamsLoader,
				schema: z.object({
					id: z.string(),
					name: z.string(),
					members: z.array(reference('people')),
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

		const result = store.get('teams', 'team1');
		assert.ok(result);
		assert.equal(result.data.members.length, 3);
		assert.deepEqual(result.data.members[0], { collection: 'people', id: 'john' });
		assert.deepEqual(result.data.members[1], { collection: 'people', id: 'jane' });
		assert.deepEqual(result.data.members[2], { collection: 'people', id: 'bob' });
	});

	it('validates and rejects invalid data', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const itemsLoader = {
			name: 'items-loader',
			load: async (context) => {
				const data = {
					id: 'invalid',
					name: 'Test Item',
					count: 'not-a-number', // Should be number
					email: 'not-an-email', // Should be valid email
				};

				try {
					const parsed = await context.parseData({
						id: 'invalid',
						data,
					});

					await context.store.set({
						id: 'invalid',
						data: parsed,
					});
				} catch (error) {
					// Store error info for testing
					await context.store.set({
						id: 'error',
						data: {
							hasError: true,
							errorMessage: error.message,
						},
					});
				}
			},
		};

		const collections = {
			items: defineCollection({
				loader: itemsLoader,
				schema: z.object({
					id: z.string(),
					name: z.string(),
					count: z.number(),
					email: z.string().email(),
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

		// The invalid entry should not be stored
		const invalidEntry = store.get('items', 'invalid');
		assert.equal(invalidEntry, undefined);

		// Check if error was captured
		const errorEntry = store.get('items', 'error');
		assert.ok(errorEntry);
		assert.equal(errorEntry.data.hasError, true);
		assert.ok(errorEntry.data.errorMessage.includes('data does not match collection schema'));
	});

	it('handles nested schemas with mixed transforms', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const articlesLoader = {
			name: 'articles-loader',
			load: async (context) => {
				const data = {
					id: 'complex',
					metadata: {
						created: '2024-01-01',
						updated: '2024-01-15T10:30:00Z',
						author: 'john-doe',
					},
					settings: {
						isPublished: true,
						// Missing priority - should use default
					},
				};

				const parsed = await context.parseData({
					id: 'complex',
					data,
				});

				await context.store.set({
					id: 'complex',
					data: parsed,
				});
			},
		};

		const collections = {
			articles: defineCollection({
				loader: articlesLoader,
				schema: z.object({
					id: z.string(),
					metadata: z.object({
						created: z.coerce.date(),
						updated: z.coerce.date(),
						author: reference('authors'),
						tags: z.array(z.string()).default([]),
					}),
					settings: z.object({
						isPublished: z.boolean().default(false),
						priority: z.number().default(0),
					}),
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

		const result = store.get('articles', 'complex');
		assert.ok(result);
		assert.ok(result.data.metadata.created instanceof Date);
		assert.ok(result.data.metadata.updated instanceof Date);
		assert.deepEqual(result.data.metadata.author, { collection: 'authors', id: 'john-doe' });
		assert.deepEqual(result.data.metadata.tags, []); // default empty array
		assert.equal(result.data.settings.isPublished, true);
		assert.equal(result.data.settings.priority, 0); // default value
	});

	it('handles optional fields correctly', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const minimalProductLoader = {
			name: 'minimal-product-loader',
			load: async (context) => {
				const data = {
					id: 'minimal',
					name: 'Minimal Product',
					// All optional fields omitted
				};

				const parsed = await context.parseData({
					id: 'minimal',
					data,
				});

				await context.store.set({
					id: 'minimal',
					data: parsed,
				});
			},
		};

		const collections = {
			products: defineCollection({
				loader: minimalProductLoader,
				schema: z.object({
					id: z.string(),
					name: z.string(),
					description: z.string().optional(),
					price: z.number().optional(),
					relatedProduct: reference('products').optional(),
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

		const result = store.get('products', 'minimal');
		assert.ok(result);
		assert.equal(result.data.description, undefined);
		assert.equal(result.data.price, undefined);
		assert.equal(result.data.relatedProduct, undefined);
	});

	it('transforms reference with default value', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const itemsLoader = {
			name: 'items-loader',
			load: async (context) => {
				// Load two items - one with category, one without
				const items = [
					{
						id: 'item1',
						name: 'Item with category',
						category: 'electronics',
					},
					{
						id: 'item2',
						name: 'Item without category',
						// No category specified - should use default
					},
				];

				for (const item of items) {
					const parsed = await context.parseData({
						id: item.id,
						data: item,
					});

					await context.store.set({
						id: item.id,
						data: parsed,
					});
				}
			},
		};

		const collections = {
			items: defineCollection({
				loader: itemsLoader,
				schema: z.object({
					id: z.string(),
					name: z.string(),
					category: reference('categories').default('general'),
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

		const result1 = store.get('items', 'item1');
		assert.deepEqual(result1.data.category, { collection: 'categories', id: 'electronics' });

		const result2 = store.get('items', 'item2');
		// The default is applied as a string, not transformed to a reference object
		assert.equal(result2.data.category, 'general');
	});
});
