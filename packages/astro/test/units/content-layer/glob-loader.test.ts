import { strict as assert } from 'node:assert';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { glob } from '../../../dist/content/loaders/glob.js';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import {
	createTempDir,
	createTestConfigObserver,
	createMinimalSettings,
	createMarkdownEntryType,
} from './test-helpers.ts';

/**
 * A markdown entry type that also exposes a `getRenderFunction`, so it exercises
 * the eager/deferred render branches of the glob loader (the base helper omits it).
 */
function createRenderableMarkdownEntryType() {
	return {
		...createMarkdownEntryType(),
		getRenderFunction: async () => async (entry: any) => ({
			html: `rendered: ${entry.body ?? ''}`,
			metadata: {},
		}),
	};
}

describe('Glob Loader', () => {
	const root = new URL('../../fixtures/content-layer/', import.meta.url);

	it('loads markdown files with glob pattern', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			spacecraft: defineCollection({
				loader: glob({ pattern: '*.md', base: 'src/content/space' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('spacecraft');
		assert.ok(entries.length > 0);

		// Check that columbia exists
		const columbia = entries.find((e) => e.id === 'columbia');
		assert.ok(columbia);
		assert.ok(columbia.body);
		assert.ok(columbia.body.includes('Space Shuttle Columbia'));
		assert.equal(columbia.filePath!.replace(/\\/g, '/'), 'src/content/space/columbia.md');
	});

	it('retains entries with numeric slug across multiple syncs', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			spacecraft: defineCollection({
				loader: glob({ pattern: '*.md', base: 'src/content/space' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		// First sync
		await contentLayer.sync();
		const numericEntry1 = store.values('spacecraft').find((e) => e.id === '20260624');
		assert.ok(numericEntry1, 'Numeric slug entry should exist after first sync');
		const count1 = store.values('spacecraft').length;

		// Second sync — the bug caused entries with numeric slugs to be dropped here
		await contentLayer.sync();
		const numericEntry2 = store.values('spacecraft').find((e) => e.id === '20260624');
		assert.ok(numericEntry2, 'Numeric slug entry should persist after second sync');
		const count2 = store.values('spacecraft').length;

		assert.equal(count1, count2, 'Entry count should be stable across syncs');
	});

	it('handles negative matches in glob pattern', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			probes: defineCollection({
				loader: glob({ pattern: ['*.md', '!voyager-*'], base: 'src/data/space-probes' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('probes');
		assert.equal(entries.length, 6);

		// Verify voyager probes are excluded
		assert.ok(entries.every((e) => !e.id.startsWith('voyager')));

		// Check that other probes exist
		const cassini = entries.find((e) => e.id === 'cassini');
		assert.ok(cassini);
	});

	it('retains body by default', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			spacecraftWithBody: defineCollection({
				loader: glob({ pattern: '*.md', base: 'src/content/space' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('spacecraftWithBody');
		assert.ok(entries.length > 0);

		const entry = entries[0];
		assert.ok(entry.body);
		assert.ok(entry.body.length > 0);
	});

	it('clears body when retainBody is false', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			spacecraftNoBody: defineCollection({
				loader: glob({ pattern: '*.md', base: 'src/content/space', retainBody: false }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('spacecraftNoBody');
		assert.ok(entries.length > 0);

		const entry = entries[0];
		assert.equal(entry.body, undefined);
	});

	it('eagerly renders renderable entries during sync by default', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createRenderableMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			spacecraft: defineCollection({
				loader: glob({ pattern: '*.md', base: 'src/content/space' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const columbia = store.values('spacecraft').find((e) => e.id === 'columbia');
		assert.ok(columbia);
		// Rendered HTML is stored eagerly, and the entry is not deferred
		assert.ok(columbia.rendered);
		assert.ok(columbia.rendered.html.includes('rendered:'));
		assert.equal(columbia.deferredRender, undefined);
	});

	it('defers rendering of renderable entries when deferRender is true', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createRenderableMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			spacecraft: defineCollection({
				loader: glob({ pattern: '*.md', base: 'src/content/space', deferRender: true }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const columbia = store.values('spacecraft').find((e) => e.id === 'columbia');
		assert.ok(columbia);
		// Rendering is deferred: no rendered HTML is stored, entry is marked deferred
		assert.equal(columbia.deferredRender, true);
		assert.equal(columbia.rendered, undefined);
		// The body is still retained so it can be rendered on demand
		assert.ok(columbia.body);
	});

	it('does not defer non-renderable data entries when deferRender is true', async () => {
		const store = new MutableDataStore();

		const yamlEntryType = {
			extensions: ['.yaml', '.yml'],
			getEntryInfo: ({ contents }: any) => ({ data: { value: contents.trim() }, body: '' }),
		};

		const settings = createMinimalSettings(root, {
			config: {
				root,
				srcDir: new URL('./src/', root),
			},
			dataEntryTypes: [yamlEntryType],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			numbersYaml: defineCollection({
				loader: glob({ pattern: 'src/data/glob-yaml/*', base: '.', deferRender: true }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('numbersYaml');
		assert.equal(entries.length, 3);
		// Data entries have no render function, so deferRender must not mark them deferred
		assert.ok(entries.every((e) => e.deferredRender === undefined));
	});

	it('loads YAML files with glob pattern', async () => {
		const store = new MutableDataStore();

		// Create custom YAML data entry type
		const yamlEntryType = {
			extensions: ['.yaml', '.yml'],
			getEntryInfo: ({ contents }: any) => {
				// Simple YAML parser
				const lines = contents.trim().split('\n');
				const data: Record<string, any> = {};
				lines.forEach((line: string) => {
					const colonIndex = line.indexOf(':');
					if (colonIndex > -1) {
						const key = line.substring(0, colonIndex).trim();
						const value = line
							.substring(colonIndex + 1)
							.trim()
							.replace(/["']/g, '');
						data[key] = value;
					}
				});
				return { data, body: '', slug: '' };
			},
		};

		const settings = createMinimalSettings(root, {
			config: {
				root,
				srcDir: new URL('./src/', root),
			},
			dataEntryTypes: [yamlEntryType],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			numbersYaml: defineCollection({
				loader: glob({ pattern: 'src/data/glob-yaml/*', base: '.' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('numbersYaml');
		assert.equal(entries.length, 3);

		const ids = entries.map((e) => e.id).sort();
		// The glob loader includes the path in the ID
		assert.deepEqual(ids, [
			'src/data/glob-yaml/one',
			'src/data/glob-yaml/three',
			'src/data/glob-yaml/two',
		]);
	});

	it('loads TOML files with glob pattern', async () => {
		const store = new MutableDataStore();

		// Create custom TOML data entry type
		const tomlEntryType = {
			extensions: ['.toml'],
			getEntryInfo: ({ contents }: any) => {
				// Simple TOML parser for key-value pairs
				const lines = contents.trim().split('\n');
				const data: Record<string, any> = {};
				lines.forEach((line: string) => {
					const equalIndex = line.indexOf('=');
					if (equalIndex > -1) {
						const key = line.substring(0, equalIndex).trim();
						const value = line
							.substring(equalIndex + 1)
							.trim()
							.replace(/["']/g, '');
						data[key] = value;
					}
				});
				return { data, body: '', slug: '' };
			},
		};

		const settings = createMinimalSettings(root, {
			config: {
				root,
				srcDir: new URL('./src/', root),
			},
			dataEntryTypes: [tomlEntryType],
		});
		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'silent',
		});

		const collections = {
			numbersToml: defineCollection({
				loader: glob({ pattern: 'src/data/glob-toml/*', base: '.' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		const entries = store.values('numbersToml');
		assert.equal(entries.length, 3);

		const ids = entries.map((e) => e.id).sort();
		// The glob loader includes the path in the ID
		assert.deepEqual(ids, [
			'src/data/glob-toml/one',
			'src/data/glob-toml/three',
			'src/data/glob-toml/two',
		]);
	});

	it('warns about missing directory', async () => {
		const store = new MutableDataStore();
		const warnings: string[] = [];
		const logger = new AstroLogger({
			destination: {
				write: (msg: any) => {
					if (msg.level === 'warn') {
						warnings.push(msg.message);
					}
					return true;
				},
			},
			level: 'info',
		});

		const settings = createMinimalSettings(root);

		const collections = {
			notADirectory: defineCollection({
				loader: glob({ pattern: '*', base: 'src/nonexistent' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		assert.ok(warnings.some((w) => w.includes('does not exist')));
	});

	it('warns about no matching files', async () => {
		const store = new MutableDataStore();
		const warnings: string[] = [];
		const logger = new AstroLogger({
			destination: {
				write: (msg: any) => {
					if (msg.level === 'warn') {
						warnings.push(msg.message);
					}
					return true;
				},
			},
			level: 'info',
		});

		const settings = createMinimalSettings(root);

		const collections = {
			nothingMatches: defineCollection({
				loader: glob({ pattern: 'nothingmatches/*', base: 'src/data' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		assert.ok(warnings.some((w) => w.includes('No files found matching')));
	});

	it('throws on duplicate IDs when prerenderConflictBehavior is error', async () => {
		const tempDir = createTempDir();
		const contentDir = join(fileURLToPath(tempDir), 'src', 'content', 'posts');
		mkdirSync(contentDir, { recursive: true });
		writeFileSync(join(contentDir, 'post.md'), '---\ntitle: Post MD\n---\nContent MD');
		writeFileSync(join(contentDir, 'post.mdx'), '---\ntitle: Post MDX\n---\nContent MDX');

		const store = new MutableDataStore();
		const settings = createMinimalSettings(tempDir, {
			contentEntryTypes: [
				createMarkdownEntryType(),
				{ extensions: ['.mdx'], getEntryInfo: createMarkdownEntryType().getEntryInfo },
			],
			config: { prerenderConflictBehavior: 'error' },
		});

		const logger = new AstroLogger({
			destination: { write: () => true },
			level: 'info',
		});

		const collections = {
			posts: defineCollection({
				loader: glob({ pattern: '*.{md,mdx}', base: 'src/content/posts' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await assert.rejects(() => contentLayer.sync(), {
			name: 'DuplicateContentEntrySlugError',
		});
	});

	it('suppresses duplicate ID warning when prerenderConflictBehavior is ignore', async () => {
		const tempDir = createTempDir();
		const contentDir = join(fileURLToPath(tempDir), 'src', 'content', 'posts');
		mkdirSync(contentDir, { recursive: true });
		writeFileSync(join(contentDir, 'post.md'), '---\ntitle: Post MD\n---\nContent MD');
		writeFileSync(join(contentDir, 'post.mdx'), '---\ntitle: Post MDX\n---\nContent MDX');

		const store = new MutableDataStore();
		const settings = createMinimalSettings(tempDir, {
			contentEntryTypes: [
				createMarkdownEntryType(),
				{ extensions: ['.mdx'], getEntryInfo: createMarkdownEntryType().getEntryInfo },
			],
			config: { prerenderConflictBehavior: 'ignore' },
		});

		const warnings: string[] = [];
		const logger = new AstroLogger({
			destination: {
				write: (msg: any) => {
					if (msg.level === 'warn') {
						warnings.push(msg.message);
					}
					return true;
				},
			},
			level: 'info',
		});

		const collections = {
			posts: defineCollection({
				loader: glob({ pattern: '*.{md,mdx}', base: 'src/content/posts' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// No duplicate warnings should be logged
		assert.ok(!warnings.some((w) => w.includes('post')));
	});

	// Colons are reserved in Windows filenames, so the file under test cannot be created there.
	it('loads files whose names contain a colon', {
		skip: process.platform === 'win32',
	}, async () => {
		const tempDir = createTempDir();
		const contentDir = join(fileURLToPath(tempDir), 'src', 'content', 'space');
		mkdirSync(contentDir, { recursive: true });
		writeFileSync(
			join(contentDir, 'Guide: Architecture.md'),
			'---\ntitle: Guide Architecture\n---\n\nA document with a colon in its filename.',
		);

		const store = new MutableDataStore();
		const errors: string[] = [];
		const settings = createMinimalSettings(tempDir, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new AstroLogger({
			destination: {
				write: (msg: any) => {
					if (msg.level === 'error') {
						errors.push(msg.message);
					}
					return true;
				},
			},
			level: 'info',
		});

		const collections = {
			spacecraft: defineCollection({
				loader: glob({ pattern: '*.md', base: 'src/content/space' }),
			}),
		};

		const contentLayer = new ContentLayer({
			settings,
			logger,
			store,
			contentConfigObserver: createTestConfigObserver(collections),
		});

		await contentLayer.sync();

		// The colon-containing file should be loaded without errors
		assert.ok(!errors.some((e) => e.includes('The URL must be of scheme file')));

		const entries = store.values('spacecraft');
		const colonEntry = entries.find((e) => e.id === 'guide-architecture');
		assert.ok(colonEntry, 'Entry with colon in filename should be loaded');
		assert.ok(colonEntry.body?.includes('colon in its filename'));
	});
});
