import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';
import { createTempDir, createTestConfigObserver, createMinimalSettings } from './test-helpers.js';

describe('Content Layer - Live Loaders', () => {
	const root = createTempDir();

	it('loads initial data through sync', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Define test data
		const entries = {
			123: {
				id: '123',
				data: { title: 'Page 123', age: 10 },
				rendered: { html: '<h1>Page 123</h1><p>This is rendered content.</p>' },
			},
			456: {
				id: '456',
				data: { title: 'Page 456', age: 20 },
			},
			789: {
				id: '789',
				data: { title: 'Page 789', age: 30 },
			},
		};

		// Create a live loader
		const testLoader = {
			name: 'test-loader',
			load: async (context) => {
				// Sync loader that loads initial data
				for (const entry of Object.values(entries)) {
					const parsed = await context.parseData({
						id: entry.id,
						data: entry.data,
					});

					await context.store.set({
						id: entry.id,
						data: parsed,
						rendered: entry.rendered,
					});
				}
			},
		};

		const collections = {
			liveStuff: defineCollection({
				loader: testLoader,
				schema: z.object({
					title: z.string(),
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

		// Verify initial data was loaded
		const allEntries = store.values('liveStuff');
		assert.equal(allEntries.length, 3);

		// Check individual entries
		const entry1 = store.get('liveStuff', '123');
		assert.ok(entry1);
		assert.equal(entry1.data.title, 'Page 123');
		assert.equal(entry1.data.age, 10);
		assert.ok(entry1.rendered);
		assert.equal(entry1.rendered.html, '<h1>Page 123</h1><p>This is rendered content.</p>');

		const entry2 = store.get('liveStuff', '456');
		assert.ok(entry2);
		assert.equal(entry2.data.title, 'Page 456');
		assert.equal(entry2.data.age, 20);
		assert.ok(!entry2.rendered); // No rendered content for this entry

		const entry3 = store.get('liveStuff', '789');
		assert.ok(entry3);
		assert.equal(entry3.data.title, 'Page 789');
		assert.equal(entry3.data.age, 30);
	});

	it('simulates live loader with loadEntry functionality', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Mock data source
		const dataSource = {
			123: { id: '123', data: { title: 'Page 123', age: 10 } },
			456: { id: '456', data: { title: 'Page 456', age: 20 } },
		};

		// Loader that simulates live loading behavior
		const liveSimulationLoader = {
			name: 'live-simulation-loader',
			load: async (context) => {
				// Initial load - only load entry 123
				const entry = dataSource['123'];
				const parsed = await context.parseData({
					id: entry.id,
					data: entry.data,
				});

				await context.store.set({
					id: entry.id,
					data: parsed,
				});

				// Store metadata about what would be available for live loading
				await context.store.set({
					id: '_meta',
					data: {
						availableIds: Object.keys(dataSource),
						supportsLiveLoading: true,
					},
				});
			},
		};

		const collections = {
			liveSimulation: defineCollection({
				loader: liveSimulationLoader,
				schema: z.object({
					title: z.string(),
					age: z.number(),
					availableIds: z.array(z.string()).optional(),
					supportsLiveLoading: z.boolean().optional(),
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

		// Check initial state
		const entry123 = store.get('liveSimulation', '123');
		assert.ok(entry123);
		assert.equal(entry123.data.title, 'Page 123');

		// Entry 456 would not be loaded initially
		const entry456 = store.get('liveSimulation', '456');
		assert.ok(!entry456);

		// Check metadata
		const meta = store.get('liveSimulation', '_meta');
		assert.ok(meta);
		assert.deepEqual(meta.data.availableIds, ['123', '456']);
		assert.equal(meta.data.supportsLiveLoading, true);
	});

	it('demonstrates dynamic data transformation', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Loader that transforms data based on context
		const transformLoader = {
			name: 'transform-loader',
			load: async (context) => {
				const entries = [
					{ id: '1', data: { title: 'Entry 1', value: 10, category: 'A' } },
					{ id: '2', data: { title: 'Entry 2', value: 20, category: 'B' } },
					{ id: '3', data: { title: 'Entry 3', value: 30, category: 'A' } },
				];

				for (const entry of entries) {
					// Apply transformations
					const transformedData = {
						...entry.data,
						// Add computed fields
						doubled: entry.data.value * 2,
						categoryLabel: `Category ${entry.data.category}`,
						timestamp: new Date('2025-01-01T00:00:00.000Z'),
					};

					const parsed = await context.parseData({
						id: entry.id,
						data: transformedData,
					});

					await context.store.set({
						id: entry.id,
						data: parsed,
					});
				}
			},
		};

		const collections = {
			transformed: defineCollection({
				loader: transformLoader,
				schema: z.object({
					title: z.string(),
					value: z.number(),
					category: z.string(),
					doubled: z.number(),
					categoryLabel: z.string(),
					timestamp: z.date(),
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

		// Verify transformations
		const entry1 = store.get('transformed', '1');
		assert.ok(entry1);
		assert.equal(entry1.data.doubled, 20);
		assert.equal(entry1.data.categoryLabel, 'Category A');

		const entry2 = store.get('transformed', '2');
		assert.ok(entry2);
		assert.equal(entry2.data.doubled, 40);
		assert.equal(entry2.data.categoryLabel, 'Category B');
	});

	it('handles loader errors gracefully', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		// Loader that simulates error conditions
		const errorProneLoader = {
			name: 'error-prone-loader',
			load: async (context) => {
				// Add some valid entries
				await context.store.set({
					id: 'valid-1',
					data: { title: 'Valid Entry 1', status: 'ok' },
				});

				// Try to parse invalid data - this should be caught by schema validation
				try {
					const parsed = await context.parseData({
						id: 'invalid-1',
						data: { title: 123, status: 'invalid' }, // title should be string
					});
					await context.store.set({
						id: 'invalid-1',
						data: parsed,
					});
				} catch (error) {
					// Store error information
					await context.store.set({
						id: 'error-log',
						data: {
							title: 'Error Log',
							status: 'error',
							errorMessage: error.message,
						},
					});
				}
			},
		};

		const collections = {
			errorProne: defineCollection({
				loader: errorProneLoader,
				schema: z.object({
					title: z.string(),
					status: z.string(),
					errorMessage: z.string().optional(),
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

		// Check valid entry
		const validEntry = store.get('errorProne', 'valid-1');
		assert.ok(validEntry);
		assert.equal(validEntry.data.title, 'Valid Entry 1');
		assert.equal(validEntry.data.status, 'ok');

		// Check that invalid entry was not stored
		const invalidEntry = store.get('errorProne', 'invalid-1');
		assert.ok(!invalidEntry);

		// Check error log
		const errorLog = store.get('errorProne', 'error-log');
		assert.ok(errorLog);
		assert.ok(errorLog.data.errorMessage);
	});

	it('supports complex rendered content', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const renderedContentLoader = {
			name: 'rendered-content-loader',
			load: async (context) => {
				const articles = [
					{
						id: 'article-1',
						data: {
							title: 'First Article',
							author: 'John Doe',
							publishDate: new Date('2025-01-15'),
						},
						content:
							'# First Article\n\nThis is the **first** article with [links](https://example.com).',
					},
					{
						id: 'article-2',
						data: {
							title: 'Second Article',
							author: 'Jane Smith',
							publishDate: new Date('2025-01-20'),
						},
						content:
							'## Second Article\n\nThis article has:\n- Lists\n- Code blocks\n\n```js\nconsole.log("Hello");\n```',
					},
				];

				for (const article of articles) {
					// Simulate rendering process
					const rendered = await context.renderMarkdown(article.content, {
						fileURL: new URL(`${article.id}.md`, root),
					});

					const parsed = await context.parseData({
						id: article.id,
						data: article.data,
					});

					await context.store.set({
						id: article.id,
						data: parsed,
						body: article.content,
						rendered: {
							html: rendered.html,
							metadata: {
								...rendered.metadata,
								wordCount: article.content.split(/\s+/).length,
								readingTime: Math.ceil(article.content.split(/\s+/).length / 200),
							},
						},
					});
				}
			},
		};

		const collections = {
			articles: defineCollection({
				loader: renderedContentLoader,
				schema: z.object({
					title: z.string(),
					author: z.string(),
					publishDate: z.date(),
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

		// Check first article
		const article1 = store.get('articles', 'article-1');
		assert.ok(article1);
		assert.equal(article1.data.title, 'First Article');
		assert.ok(article1.body);
		assert.ok(article1.rendered);
		assert.ok(article1.rendered.html);
		assert.ok(article1.rendered.html.includes('First Article'));
		assert.ok(article1.rendered.metadata);
		assert.ok(article1.rendered.metadata.wordCount > 0);

		// Check second article
		const article2 = store.get('articles', 'article-2');
		assert.ok(article2);
		assert.ok(article2.rendered);
		// Check for code block rendering
		assert.ok(article2.rendered.html.includes('<pre') || article2.rendered.html.includes('<code'));
	});

	it('demonstrates cache metadata patterns', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const cacheAwareLoader = {
			name: 'cache-aware-loader',
			load: async (context) => {
				const now = new Date();
				const entries = [
					{
						id: 'static-content',
						data: {
							title: 'Static Page',
							type: 'static',
							content: 'This content rarely changes',
						},
						cache: {
							lastModified: new Date('2024-01-01'),
							maxAge: 86400 * 30, // 30 days
							tags: ['static', 'page'],
						},
					},
					{
						id: 'dynamic-content',
						data: {
							title: 'Dynamic Dashboard',
							type: 'dynamic',
							content: 'This updates frequently',
						},
						cache: {
							lastModified: now,
							maxAge: 300, // 5 minutes
							tags: ['dynamic', 'dashboard', 'realtime'],
						},
					},
					{
						id: 'user-content',
						data: {
							title: 'User Profile',
							type: 'personalized',
							content: 'User-specific content',
						},
						cache: {
							lastModified: now,
							maxAge: 0, // No caching
							tags: ['user', 'personalized', 'no-cache'],
						},
					},
				];

				for (const entry of entries) {
					const parsed = await context.parseData({
						id: entry.id,
						data: {
							...entry.data,
							cacheInfo: {
								maxAge: entry.cache.maxAge,
								tags: entry.cache.tags,
								lastModified: entry.cache.lastModified.toISOString(),
							},
						},
					});

					await context.store.set({
						id: entry.id,
						data: parsed,
					});
				}
			},
		};

		const collections = {
			cached: defineCollection({
				loader: cacheAwareLoader,
				schema: z.object({
					title: z.string(),
					type: z.string(),
					content: z.string(),
					cacheInfo: z.object({
						maxAge: z.number(),
						tags: z.array(z.string()),
						lastModified: z.string(),
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

		// Verify static content caching
		const staticContent = store.get('cached', 'static-content');
		assert.ok(staticContent);
		assert.equal(staticContent.data.cacheInfo.maxAge, 86400 * 30);
		assert.ok(staticContent.data.cacheInfo.tags.includes('static'));

		// Verify dynamic content caching
		const dynamicContent = store.get('cached', 'dynamic-content');
		assert.ok(dynamicContent);
		assert.equal(dynamicContent.data.cacheInfo.maxAge, 300);
		assert.ok(dynamicContent.data.cacheInfo.tags.includes('realtime'));

		// Verify personalized content caching
		const userContent = store.get('cached', 'user-content');
		assert.ok(userContent);
		assert.equal(userContent.data.cacheInfo.maxAge, 0);
		assert.ok(userContent.data.cacheInfo.tags.includes('no-cache'));
	});

	it('validates schema during data loading', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root);
		const logger = new Logger({
			dest: { write: () => true },
			level: 'silent',
		});

		const validationLoader = {
			name: 'validation-loader',
			load: async (context) => {
				const testData = [
					// Valid entries
					{ id: 'valid-1', data: { name: 'Alice', age: 30, email: 'alice@example.com' } },
					{ id: 'valid-2', data: { name: 'Bob', age: 25, email: 'bob@example.com' } },
					// Invalid entries (these will fail schema validation)
					{ id: 'invalid-age', data: { name: 'Charlie', age: -5, email: 'charlie@example.com' } },
					{ id: 'invalid-email', data: { name: 'David', age: 35, email: 'not-an-email' } },
					{ id: 'missing-field', data: { name: 'Eve', age: 28 } }, // missing email
				];

				let successCount = 0;
				let errorCount = 0;

				for (const item of testData) {
					try {
						const parsed = await context.parseData({
							id: item.id,
							data: item.data,
						});

						await context.store.set({
							id: item.id,
							data: parsed,
						});
						successCount++;
					} catch (_error) {
						errorCount++;
						// Optionally store validation errors
						if (item.id.startsWith('invalid')) {
							await context.store.set({
								id: `${item.id}-error`,
								data: {
									name: `Error for ${item.data.name}`,
									age: 0,
									email: 'error@example.com',
									validationError: true,
								},
							});
						}
					}
				}

				// Store summary
				await context.store.set({
					id: '_validation_summary',
					data: {
						name: 'Validation Summary',
						age: 0,
						email: 'summary@example.com',
						successCount,
						errorCount,
					},
				});
			},
		};

		const collections = {
			validated: defineCollection({
				loader: validationLoader,
				schema: z.object({
					name: z.string().min(1),
					age: z.number().positive(),
					email: z.string().email(),
					validationError: z.boolean().optional(),
					successCount: z.number().optional(),
					errorCount: z.number().optional(),
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

		// Check valid entries
		const valid1 = store.get('validated', 'valid-1');
		assert.ok(valid1);
		assert.equal(valid1.data.name, 'Alice');
		assert.equal(valid1.data.age, 30);

		const valid2 = store.get('validated', 'valid-2');
		assert.ok(valid2);
		assert.equal(valid2.data.name, 'Bob');

		// Check that invalid entries were not stored
		const invalidAge = store.get('validated', 'invalid-age');
		assert.ok(!invalidAge);

		const invalidEmail = store.get('validated', 'invalid-email');
		assert.ok(!invalidEmail);

		const missingField = store.get('validated', 'missing-field');
		assert.ok(!missingField);

		// Check summary
		const summary = store.get('validated', '_validation_summary');
		assert.ok(summary);
		assert.equal(summary.data.successCount, 2); // Only valid-1 and valid-2
		assert.equal(summary.data.errorCount, 3); // Three invalid entries
	});
});
