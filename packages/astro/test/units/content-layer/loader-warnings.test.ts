import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';
import { createTempDir, createTestConfigObserver, createMinimalSettings } from './test-helpers.js';
import { Writable } from 'node:stream';
import fs from 'node:fs/promises';

describe('Content Layer - Loader Warnings', () => {
	it('warns about missing data in loaders', async () => {
		const root = createTempDir();
		const store = new MutableDataStore();
		const logs = [];

		const logger = new Logger({
			level: 'warn',
			dest: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});

		// Loader that simulates various warning scenarios
		const warningLoader = {
			name: 'warning-loader',
			load: async (context) => {
				// Warn about missing directory
				context.logger.warn('Directory "src/content/non-existent-dir" does not exist');

				// Add some valid entries
				await context.store.set({
					id: 'valid-1',
					data: { title: 'Valid Entry', status: 'ok' },
				});

				// Try to add duplicate ID - this should be handled by the store
				await context.store.set({
					id: 'duplicate-id',
					data: { title: 'First Entry', value: 1 },
				});

				// Second attempt with same ID (store will overwrite)
				await context.store.set({
					id: 'duplicate-id',
					data: { title: 'Second Entry', value: 2 },
				});

				// Log warning about duplicate
				context.logger.warn('Duplicate id "duplicate-id" found in collection');
			},
		};

		const collections = {
			warnings: defineCollection({
				loader: warningLoader,
				schema: z.object({
					title: z.string(),
					status: z.string().optional(),
					value: z.number().optional(),
				}),
			}),
		};

		const settings = createMinimalSettings(root);

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check for warning logs
		const missingDirWarning = logs.find(
			(log) => log.level === 'warn' && log.message.includes('does not exist'),
		);
		assert.ok(missingDirWarning, 'Should warn about missing directory');

		const duplicateWarning = logs.find(
			(log) => log.level === 'warn' && log.message.includes('Duplicate id'),
		);
		assert.ok(duplicateWarning, 'Should warn about duplicate ID');

		// Verify entries
		const validEntry = store.get('warnings', 'valid-1');
		assert.ok(validEntry);
		assert.equal(validEntry.data.title, 'Valid Entry');

		// Duplicate ID should have the second entry's data (overwritten)
		const duplicateEntry = store.get('warnings', 'duplicate-id');
		assert.ok(duplicateEntry);
		assert.equal(duplicateEntry.data.title, 'Second Entry');
		assert.equal(duplicateEntry.data.value, 2);
	});

	it('warns about no files found in pattern matching', async () => {
		const root = createTempDir();
		const store = new MutableDataStore();
		const logs = [];

		const logger = new Logger({
			level: 'warn',
			dest: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});

		// Create an empty directory
		const emptyDir = new URL('./src/content/empty/', root);
		await fs.mkdir(emptyDir, { recursive: true });

		// Loader that simulates glob pattern with no matches
		const emptyPatternLoader = {
			name: 'empty-pattern-loader',
			load: async (context) => {
				// Simulate checking for files and finding none
				const pattern = '*.mdx';
				const base = 'src/content/empty';

				context.logger.warn(`No files found matching pattern "${pattern}" in "${base}"`);

				// Store metadata about the empty result
				await context.store.set({
					id: '_meta',
					data: {
						pattern,
						base,
						filesFound: 0,
						message: 'No matching files',
					},
				});
			},
		};

		const collections = {
			emptyPattern: defineCollection({
				loader: emptyPatternLoader,
				schema: z.object({
					pattern: z.string().optional(),
					base: z.string().optional(),
					filesFound: z.number().optional(),
					message: z.string().optional(),
				}),
			}),
		};

		const settings = createMinimalSettings(root);

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check for warning
		const noFilesWarning = logs.find(
			(log) => log.level === 'warn' && log.message.includes('No files found matching'),
		);
		assert.ok(noFilesWarning, 'Should warn about no files found');

		// Check metadata
		const meta = store.get('emptyPattern', '_meta');
		assert.ok(meta);
		assert.equal(meta.data.filesFound, 0);
	});

	it('handles validation errors gracefully', async () => {
		const root = createTempDir();
		const store = new MutableDataStore();
		const logs = [];

		const logger = new Logger({
			level: 'error',
			dest: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});

		// Loader that produces validation errors
		const validationErrorLoader = {
			name: 'validation-error-loader',
			load: async (context) => {
				const testData = [
					{ id: 'item1', name: 'Valid Item', count: 5 },
					{ id: 'item2', count: 10 }, // Missing required 'name'
					{ name: 'No ID Item', count: 15 }, // Would fail if 'id' is required by schema
					{ id: 'item3', name: 'Invalid Count', count: 'not-a-number' }, // Wrong type
				];

				let successCount = 0;
				let errorCount = 0;

				for (const item of testData) {
					try {
						const parsed = await context.parseData({
							id: item.id || 'generated-' + Date.now(),
							data: item,
						});

						await context.store.set({
							id: item.id || 'generated-' + Date.now(),
							data: parsed,
						});
						successCount++;
					} catch (error) {
						errorCount++;
						context.logger.error(`Validation failed for ${item.id || 'unknown'}: ${error.message}`);
					}
				}

				// Store summary
				await context.store.set({
					id: '_summary',
					data: {
						name: 'Validation Summary',
						count: 0,
						validationStats: {
							success: successCount,
							errors: errorCount,
						},
					},
				});
			},
		};

		const collections = {
			validated: defineCollection({
				loader: validationErrorLoader,
				schema: z.object({
					name: z.string(),
					count: z.number(),
					validationStats: z
						.object({
							success: z.number(),
							errors: z.number(),
						})
						.optional(),
				}),
			}),
		};

		const settings = createMinimalSettings(root);

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check for validation error logs
		const validationErrors = logs.filter(
			(log) => log.level === 'error' && log.message.includes('Validation failed'),
		);
		assert.ok(validationErrors.length > 0, 'Should log validation errors');

		// Check valid entry
		const validEntry = store.get('validated', 'item1');
		assert.ok(validEntry);
		assert.equal(validEntry.data.name, 'Valid Item');
		assert.equal(validEntry.data.count, 5);

		// Check summary
		const summary = store.get('validated', '_summary');
		assert.ok(summary);
		assert.ok(summary.data.validationStats.errors > 0);
	});

	it('handles malformed data gracefully', async () => {
		const root = createTempDir();
		const store = new MutableDataStore();
		const logs = [];

		const logger = new Logger({
			level: 'error',
			dest: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});

		// Loader that simulates processing malformed data
		const malformedDataLoader = {
			name: 'malformed-data-loader',
			load: async (context) => {
				// Simulate trying to parse malformed JSON
				const malformedJson = '{ "id": "test", "name": "Missing closing brace"';

				try {
					// This would throw
					const data = JSON.parse(malformedJson);
					await context.store.set({
						id: 'should-not-exist',
						data,
					});
				} catch (error) {
					context.logger.error(`Failed to parse JSON: ${error.message}`);

					// Store error info
					await context.store.set({
						id: 'parse-error',
						data: {
							error: 'JSON Parse Error',
							message: error.message,
							recovered: true,
						},
					});
				}

				// Add a valid entry to show the loader can continue
				await context.store.set({
					id: 'valid-after-error',
					data: {
						error: 'None',
						message: 'Successfully loaded after error',
						recovered: true,
					},
				});
			},
		};

		const collections = {
			malformed: defineCollection({
				loader: malformedDataLoader,
				schema: z.object({
					error: z.string(),
					message: z.string(),
					recovered: z.boolean(),
				}),
			}),
		};

		const settings = createMinimalSettings(root);

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check for JSON error log
		const jsonError = logs.find((log) => log.level === 'error' && log.message.includes('JSON'));
		assert.ok(jsonError, 'Should log JSON parse error');

		// Check that error was handled
		const errorEntry = store.get('malformed', 'parse-error');
		assert.ok(errorEntry);
		assert.equal(errorEntry.data.error, 'JSON Parse Error');
		assert.ok(errorEntry.data.recovered);

		// Check that loader continued after error
		const validEntry = store.get('malformed', 'valid-after-error');
		assert.ok(validEntry);
		assert.equal(validEntry.data.error, 'None');
	});

	it('warns about duplicate IDs across multiple entries', async () => {
		const root = createTempDir();
		const store = new MutableDataStore();
		const logs = [];

		const logger = new Logger({
			level: 'warn',
			dest: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});

		// Create data directory with test files
		const dataDir = new URL('./src/data/', root);
		await fs.mkdir(dataDir, { recursive: true });

		// Write a JSON file with duplicate IDs
		await fs.writeFile(
			new URL('./dogs.json', dataDir),
			JSON.stringify([
				{ id: 'german-shepherd', breed: 'German Shepherd', size: 'Large' },
				{ id: 'beagle', breed: 'Beagle', size: 'Small' },
				{ id: 'german-shepherd', breed: 'German Shepherd Mix', size: 'Medium' }, // Duplicate
			]),
		);

		// Loader that processes array data and warns about duplicates
		const duplicateCheckLoader = {
			name: 'duplicate-check-loader',
			load: async (context) => {
				// Read and parse the file
				const filePath = new URL('./dogs.json', dataDir);
				const content = await fs.readFile(filePath, 'utf-8');
				const dogs = JSON.parse(content);

				const seenIds = new Set();

				for (const dog of dogs) {
					if (seenIds.has(dog.id)) {
						context.logger.warn(`Duplicate id "${dog.id}" found in src/data/dogs.json`);
					}
					seenIds.add(dog.id);

					const parsed = await context.parseData({
						id: dog.id,
						data: dog,
					});

					// Store will overwrite duplicates
					await context.store.set({
						id: dog.id,
						data: parsed,
					});
				}
			},
		};

		const collections = {
			dogs: defineCollection({
				loader: duplicateCheckLoader,
				schema: z.object({
					id: z.string(),
					breed: z.string(),
					size: z.string(),
				}),
			}),
		};

		const settings = createMinimalSettings(root);

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check for duplicate warning
		const duplicateWarning = logs.find(
			(log) =>
				log.level === 'warn' &&
				log.message.includes('Duplicate id "german-shepherd"') &&
				log.message.includes('dogs.json'),
		);
		assert.ok(duplicateWarning, 'Should warn about duplicate ID');

		// Check entries - last duplicate wins
		const entries = store.values('dogs');
		assert.equal(entries.length, 2); // Only 2 unique IDs

		const germanShepherd = store.get('dogs', 'german-shepherd');
		assert.ok(germanShepherd);
		assert.equal(germanShepherd.data.breed, 'German Shepherd Mix'); // Last one wins
		assert.equal(germanShepherd.data.size, 'Medium');
	});

	it('handles missing required fields with helpful errors', async () => {
		const root = createTempDir();
		const store = new MutableDataStore();
		const logs = [];

		const logger = new Logger({
			level: 'error',
			dest: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});

		// Loader with strict schema validation
		const strictSchemaLoader = {
			name: 'strict-schema-loader',
			load: async (context) => {
				const items = [
					{ id: 'complete', title: 'Complete Item', priority: 'high', tags: ['important'] },
					{ id: 'missing-title', priority: 'low', tags: [] }, // Missing required title
					{ id: 'missing-priority', title: 'No Priority' }, // Missing required priority
					{ id: 'invalid-tags', title: 'Bad Tags', priority: 'medium', tags: 'not-an-array' }, // Wrong type
				];

				for (const item of items) {
					try {
						const parsed = await context.parseData({
							id: item.id,
							data: item,
						});

						await context.store.set({
							id: item.id,
							data: parsed,
						});
					} catch (error) {
						// Log detailed validation error
						const issues = error.errors || [];
						const fields = issues.map((issue) => issue.path.join('.')).join(', ');
						context.logger.error(
							`Validation failed for item "${item.id}": Missing or invalid fields: ${fields || error.message}`,
						);
					}
				}
			},
		};

		const collections = {
			strictItems: defineCollection({
				loader: strictSchemaLoader,
				schema: z.object({
					title: z.string(),
					priority: z.enum(['low', 'medium', 'high']),
					tags: z.array(z.string()).optional().default([]),
				}),
			}),
		};

		const settings = createMinimalSettings(root);

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// Check for specific validation errors
		const validationLogs = logs.filter(
			(log) => log.level === 'error' && log.message.includes('Validation failed'),
		);
		assert.ok(validationLogs.length >= 2, 'Should have validation errors for invalid items');

		// Only complete item should be stored
		const completeItem = store.get('strictItems', 'complete');
		assert.ok(completeItem);
		assert.equal(completeItem.data.title, 'Complete Item');
		assert.equal(completeItem.data.priority, 'high');
		assert.deepEqual(completeItem.data.tags, ['important']);

		// Invalid items should not be stored
		assert.ok(!store.get('strictItems', 'missing-title'));
		assert.ok(!store.get('strictItems', 'missing-priority'));
		assert.ok(!store.get('strictItems', 'invalid-tags'));
	});
});
