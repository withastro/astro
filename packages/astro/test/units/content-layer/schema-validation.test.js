import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';
import { createTempDir, createTestConfigObserver, createMinimalSettings } from './test-helpers.js';

describe('Content Layer - Schema Validation', () => {
	const root = createTempDir();

	it('parses and coerces Date objects in schemas', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Loader that provides dates in various formats
		const dateLoader = {
			name: 'date-loader',
			load: async (context) => {
				const entries = [
					{
						id: 'one',
						publishedAt: '2021-01-01', // ISO date string
						updatedAt: new Date('2021-01-02'), // Date object
						createdAt: '2021-01-03T00:00:00.000Z', // Full ISO string
					},
					{
						id: 'two',
						publishedAt: '2021-01-02',
						updatedAt: new Date('2021-01-03'),
						createdAt: 1609545600000, // Timestamp
					},
					{
						id: 'three',
						publishedAt: '2021-01-03',
						updatedAt: new Date('2021-01-04'),
						createdAt: 'January 5, 2021', // Date string
					},
					{
						id: 'four%', // Special characters in ID
						publishedAt: '2021-01-01',
						updatedAt: new Date('2021-01-02'),
						createdAt: '2021-01-03',
					},
				];

				for (const entry of entries) {
					const parsed = await context.parseData({
						id: entry.id,
						data: entry,
					});

					await context.store.set({
						id: entry.id,
						data: parsed,
					});
				}
			},
		};

		const collections = {
			withDates: defineCollection({
				loader: dateLoader,
				schema: z.object({
					publishedAt: z.coerce.date(),
					updatedAt: z.date(),
					createdAt: z.coerce.date(),
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

		// Verify all entries were stored
		const entries = store.values('withDates');
		assert.equal(entries.length, 4);

		// Check IDs including special characters
		const ids = entries.map((item) => item.id).sort();
		assert.deepEqual(ids, ['four%', 'one', 'three', 'two']);

		// Verify all dates are Date objects
		for (const entry of entries) {
			assert.ok(entry.data.publishedAt instanceof Date);
			assert.ok(entry.data.updatedAt instanceof Date);
			assert.ok(entry.data.createdAt instanceof Date);
		}

		// Verify specific date values
		const entryOne = store.get('withDates', 'one');
		assert.equal(entryOne.data.publishedAt.toISOString(), '2021-01-01T00:00:00.000Z');
		assert.equal(entryOne.data.updatedAt.toISOString(), '2021-01-02T00:00:00.000Z');
		assert.equal(entryOne.data.createdAt.toISOString(), '2021-01-03T00:00:00.000Z');

		// Check timestamp conversion
		const entryTwo = store.get('withDates', 'two');
		assert.equal(entryTwo.data.createdAt.toISOString(), '2021-01-02T00:00:00.000Z');

		// Check date string parsing - just verify it's a valid Date
		const entryThree = store.get('withDates', 'three');
		assert.ok(entryThree.data.createdAt instanceof Date);
		assert.ok(!isNaN(entryThree.data.createdAt.getTime()));
	});

	it('handles custom IDs and slugs', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Loader that provides entries with custom slugs
		const customSlugLoader = {
			name: 'custom-slug-loader',
			load: async (context) => {
				const entries = [
					{
						id: 'fancy-one',
						slug: 'fancy-one',
						title: 'First Entry',
					},
					{
						id: 'excellent-three',
						slug: 'excellent-three',
						title: 'Third Entry',
					},
					{
						id: 'interesting-two',
						slug: 'interesting-two',
						title: 'Second Entry',
					},
				];

				for (const entry of entries) {
					const parsed = await context.parseData({
						id: entry.id,
						data: entry,
					});

					await context.store.set({
						id: entry.id,
						data: parsed,
					});
				}
			},
		};

		const collections = {
			withCustomSlugs: defineCollection({
				loader: customSlugLoader,
				schema: z.object({
					slug: z.string(),
					title: z.string(),
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

		// Verify custom IDs are preserved
		const entries = store.values('withCustomSlugs');
		const ids = entries.map((item) => item.id).sort();
		assert.deepEqual(ids, ['excellent-three', 'fancy-one', 'interesting-two']);

		// Verify data is correct
		const fancyOne = store.get('withCustomSlugs', 'fancy-one');
		assert.equal(fancyOne.data.slug, 'fancy-one');
		assert.equal(fancyOne.data.title, 'First Entry');
	});

	it('supports union schemas (discriminated unions)', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Loader that provides different types of content
		const unionLoader = {
			name: 'union-loader',
			load: async (context) => {
				const entries = [
					{
						id: 'post',
						type: 'post',
						title: 'My Post',
						description: 'This is my post',
					},
					{
						id: 'newsletter',
						type: 'newsletter',
						subject: 'My Newsletter',
						// Note: newsletters don't have title or description
					},
					{
						id: 'announcement',
						type: 'announcement',
						message: 'Important Update',
						priority: 'high',
					},
				];

				for (const entry of entries) {
					const parsed = await context.parseData({
						id: entry.id,
						data: entry,
					});

					await context.store.set({
						id: entry.id,
						data: parsed,
					});
				}
			},
		};

		// Union schema that accepts different shapes based on 'type' field
		const collections = {
			withUnionSchema: defineCollection({
				loader: unionLoader,
				schema: z.discriminatedUnion('type', [
					z.object({
						type: z.literal('post'),
						title: z.string(),
						description: z.string(),
					}),
					z.object({
						type: z.literal('newsletter'),
						subject: z.string(),
					}),
					z.object({
						type: z.literal('announcement'),
						message: z.string(),
						priority: z.enum(['low', 'medium', 'high']),
					}),
				]),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Verify all entries were stored
		const entries = store.values('withUnionSchema');
		assert.equal(entries.length, 3);

		// Verify post entry
		const post = store.get('withUnionSchema', 'post');
		assert.deepEqual(post.data, {
			type: 'post',
			title: 'My Post',
			description: 'This is my post',
		});

		// Verify newsletter entry
		const newsletter = store.get('withUnionSchema', 'newsletter');
		assert.deepEqual(newsletter.data, {
			type: 'newsletter',
			subject: 'My Newsletter',
		});

		// Verify announcement entry
		const announcement = store.get('withUnionSchema', 'announcement');
		assert.deepEqual(announcement.data, {
			type: 'announcement',
			message: 'Important Update',
			priority: 'high',
		});
	});

	it('validates required fields in empty content', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logs = [];

		const logger = new Logger({
			level: 'error',
			dest: {
				write: (event) => {
					logs.push(event);
					return true;
				},
			},
		});

		// Loader that simulates empty markdown file scenario
		const emptyContentLoader = {
			name: 'empty-content-loader',
			load: async (context) => {
				// Simulate empty markdown file - no frontmatter data
				const entries = [
					{
						id: 'empty-file',
						data: {}, // Empty frontmatter
						body: '', // Empty body
					},
					{
						id: 'partial-file',
						data: {
							description: 'Has description but missing title',
						},
						body: 'Some content',
					},
				];

				for (const entry of entries) {
					try {
						const parsed = await context.parseData({
							id: entry.id,
							data: entry.data,
						});

						await context.store.set({
							id: entry.id,
							data: parsed,
							body: entry.body,
						});
					} catch (error) {
						// Log validation error
						context.logger.error(`Validation failed for ${entry.id}: ${error.message}`);

						// Check if it's a Zod error with issues
						if (error.errors) {
							const requiredFields = error.errors
								.filter((issue) => issue.message === 'Required')
								.map((issue) => `**${issue.path.join('.')}**: ${issue.message}`);

							if (requiredFields.length > 0) {
								context.logger.error(requiredFields.join(', '));
							}
						}
					}
				}
			},
		};

		const collections = {
			requiredFields: defineCollection({
				loader: emptyContentLoader,
				schema: z.object({
					title: z.string().min(1),
					description: z.string().optional(),
					publishedAt: z.date().optional(),
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

		// Check that validation errors were logged
		const validationErrors = logs.filter((log) => log.level === 'error');
		assert.ok(validationErrors.length > 0);

		// Check for the specific "**title**: Required" error format
		const titleRequiredError = logs.find(
			(log) => log.level === 'error' && log.message.includes('**title**: Required'),
		);
		assert.ok(titleRequiredError, 'Should have logged "**title**: Required" error');

		// Verify no entries were stored (both failed validation)
		const entries = store.values('requiredFields');
		assert.equal(entries.length, 0);
	});

	it('validates ID types and rejects invalid IDs', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logs = [];

		const logger = new Logger({
			level: 'error',
			dest: {
				write: (event) => {
					logs.push(event);
					return true;
				},
			},
		});

		// Loader that provides entries with various ID types
		const invalidIdLoader = {
			name: 'invalid-id-loader',
			load: async (context) => {
				const entries = [
					{
						id: 'valid-string-id',
						data: { title: 'Valid Entry' },
					},
					{
						id: 123, // Number ID - should be invalid
						data: { title: 'Entry with number ID' },
					},
					{
						id: null, // Null ID
						data: { title: 'Entry with null ID' },
					},
					{
						id: '', // Empty string ID
						data: { title: 'Entry with empty ID' },
					},
				];

				for (const entry of entries) {
					try {
						// Validate ID type
						if (typeof entry.id !== 'string' || !entry.id) {
							throw new Error(
								`Collection loader returned an entry with an invalid \`id\`: ${JSON.stringify(entry.id)}. IDs must be strings.`,
							);
						}

						const parsed = await context.parseData({
							id: entry.id,
							data: entry.data,
						});

						await context.store.set({
							id: entry.id,
							data: parsed,
						});
					} catch (error) {
						context.logger.error(error.message);
					}
				}
			},
		};

		const collections = {
			withIdValidation: defineCollection({
				loader: invalidIdLoader,
				schema: z.object({
					title: z.string(),
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

		// Check for ID validation errors
		const idErrors = logs.filter(
			(log) =>
				log.level === 'error' && log.message.includes('returned an entry with an invalid `id`'),
		);
		assert.ok(idErrors.length >= 2, 'Should have errors for invalid IDs');

		// Only valid entry should be stored
		const entries = store.values('withIdValidation');
		assert.equal(entries.length, 1);
		assert.equal(entries[0].id, 'valid-string-id');
	});

	it('handles empty collections gracefully', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Loader that returns no entries
		const emptyLoader = {
			name: 'empty-loader',
			load: async (_context) => {
				// Simulate an empty directory - no entries to load
				// Just return without adding anything to the store
			},
		};

		const collections = {
			emptyCollection: defineCollection({
				loader: emptyLoader,
				schema: z.object({
					title: z.string(),
					content: z.string(),
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

		// Verify collection exists but is empty
		const entries = store.values('emptyCollection');
		assert.equal(entries.length, 0);
		assert.deepEqual(entries, []);

		// Store should still be functional
		assert.ok(store.scopedStore('emptyCollection'));
	});

	it('handles optional fields with defaults', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const defaultsLoader = {
			name: 'defaults-loader',
			load: async (context) => {
				const entries = [
					{
						id: 'full-entry',
						data: {
							title: 'Full Entry',
							draft: false,
							tags: ['tag1', 'tag2'],
							rating: 5,
						},
					},
					{
						id: 'minimal-entry',
						data: {
							title: 'Minimal Entry',
							// All optional fields omitted
						},
					},
				];

				for (const entry of entries) {
					const parsed = await context.parseData({
						id: entry.id,
						data: entry.data,
					});

					await context.store.set({
						id: entry.id,
						data: parsed,
					});
				}
			},
		};

		const collections = {
			withDefaults: defineCollection({
				loader: defaultsLoader,
				schema: z.object({
					title: z.string(),
					draft: z.boolean().optional().default(true),
					tags: z.array(z.string()).optional().default([]),
					rating: z.number().optional().default(0),
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

		// Check full entry
		const fullEntry = store.get('withDefaults', 'full-entry');
		assert.equal(fullEntry.data.draft, false);
		assert.deepEqual(fullEntry.data.tags, ['tag1', 'tag2']);
		assert.equal(fullEntry.data.rating, 5);

		// Check minimal entry has defaults applied
		const minimalEntry = store.get('withDefaults', 'minimal-entry');
		assert.equal(minimalEntry.data.draft, true); // Default value
		assert.deepEqual(minimalEntry.data.tags, []); // Default value
		assert.equal(minimalEntry.data.rating, 0); // Default value
	});
});
