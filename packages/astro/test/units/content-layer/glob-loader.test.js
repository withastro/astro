import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { glob } from '../../../dist/content/loaders/glob.js';
import { defineCollection } from '../../../dist/content/config.js';
import { ContentLayer } from '../../../dist/content/content-layer.js';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { Logger } from '../../../dist/core/logger/core.js';
import {
	createTestConfigObserver,
	createMinimalSettings,
	createMarkdownEntryType,
} from './test-helpers.js';

describe('Glob Loader', () => {
	const root = new URL('../../fixtures/content-layer/', import.meta.url);

	it('loads markdown files with glob pattern', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new Logger({
			dest: { write: () => true },
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
		assert.equal(columbia.filePath.replace(/\\/g, '/'), 'src/content/space/columbia.md');
	});

	it('handles negative matches in glob pattern', async () => {
		const store = new MutableDataStore();
		const settings = createMinimalSettings(root, {
			contentEntryTypes: [createMarkdownEntryType()],
		});
		const logger = new Logger({
			dest: { write: () => true },
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
		const logger = new Logger({
			dest: { write: () => true },
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
		const logger = new Logger({
			dest: { write: () => true },
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

	it('loads YAML files with glob pattern', async () => {
		const store = new MutableDataStore();

		// Create custom YAML data entry type
		const yamlEntryType = {
			extensions: ['.yaml', '.yml'],
			getEntryInfo: ({ contents }) => {
				// Simple YAML parser
				const lines = contents.trim().split('\n');
				const data = {};
				lines.forEach((line) => {
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
		const logger = new Logger({
			dest: { write: () => true },
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
			getEntryInfo: ({ contents }) => {
				// Simple TOML parser for key-value pairs
				const lines = contents.trim().split('\n');
				const data = {};
				lines.forEach((line) => {
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
		const logger = new Logger({
			dest: { write: () => true },
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
});
