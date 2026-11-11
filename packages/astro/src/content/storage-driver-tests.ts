import type { CollectionStorageDriver, StoredEntry } from './storage.js';

export interface StorageDriverTest {
	name: string;
	run: () => Promise<void>;
}

/**
 * Returns the tests a collection storage driver must pass, independent of any test runner.
 * `createDriver` is called once per test and must return a driver with no snapshots.
 *
 * ```ts
 * import { describe, it } from 'node:test';
 * import { createStorageDriverTests } from 'astro/content/storage-driver-tests';
 *
 * describe('my driver', () => {
 *   for (const test of createStorageDriverTests(() => createDriver(config))) {
 *     it(test.name, test.run);
 *   }
 * });
 * ```
 */
export function createStorageDriverTests(
	createDriver: () => CollectionStorageDriver | Promise<CollectionStorageDriver>,
): StorageDriverTest[] {
	const intro: StoredEntry = { id: 'intro', metadata: 'intro-metadata', content: 'intro-content' };
	const setup: StoredEntry = { id: 'setup', metadata: 'setup-metadata' };

	return [
		{
			name: 'reads the entries written to a committed snapshot',
			async run() {
				const driver = await createDriver();
				await writeSnapshot(driver, 'snapshot-1', { docs: [intro, setup] });
				const reader = await driver.openReader({ snapshot: 'snapshot-1' });

				assertEqual(await reader.get('docs', 'intro', { content: true }), intro, 'get()');
				assertEqual(await reader.get('docs', 'setup', { content: true }), setup, 'get()');
				assertEqual(
					sortById(await reader.entries('docs', { content: true })),
					[intro, setup],
					'entries()',
				);
			},
		},
		{
			name: 'returns nothing for missing entries and collections',
			async run() {
				const driver = await createDriver();
				await writeSnapshot(driver, 'snapshot-1', { docs: [intro] });
				const reader = await driver.openReader({ snapshot: 'snapshot-1' });

				assertEqual(await reader.get('docs', 'missing', { content: true }), undefined, 'get()');
				assertEqual(await reader.get('guides', 'intro', { content: true }), undefined, 'get()');
				assertEqual(await reader.entries('guides', { content: true }), [], 'entries()');
			},
		},
		{
			name: 'keeps collections of a snapshot apart',
			async run() {
				const driver = await createDriver();
				await writeSnapshot(driver, 'snapshot-1', { docs: [intro], guides: [setup] });
				const reader = await driver.openReader({ snapshot: 'snapshot-1' });

				assertEqual(await reader.entries('docs', { content: true }), [intro], 'docs');
				assertEqual(await reader.entries('guides', { content: true }), [setup], 'guides');
			},
		},
		{
			name: 'keeps snapshots apart',
			async run() {
				const driver = await createDriver();
				await writeSnapshot(driver, 'snapshot-1', { docs: [intro] });
				await writeSnapshot(driver, 'snapshot-2', { docs: [setup] });
				const first = await driver.openReader({ snapshot: 'snapshot-1' });
				const second = await driver.openReader({ snapshot: 'snapshot-2' });

				assertEqual(await first.entries('docs', { content: true }), [intro], 'first');
				assertEqual(await second.entries('docs', { content: true }), [setup], 'second');
			},
		},
		{
			name: 'returns entries without content when it is not requested',
			async run() {
				const driver = await createDriver();
				await writeSnapshot(driver, 'snapshot-1', { docs: [intro] });
				const reader = await driver.openReader({ snapshot: 'snapshot-1' });
				const withoutContent = { id: intro.id, metadata: intro.metadata };

				const entry = await reader.get('docs', 'intro', { content: false });
				assertEqual({ id: entry?.id, metadata: entry?.metadata }, withoutContent, 'get()');
				const [listed] = await reader.entries('docs', { content: false });
				assertEqual({ id: listed?.id, metadata: listed?.metadata }, withoutContent, 'entries()');
			},
		},
		{
			name: 'stores entries larger than a page of results',
			async run() {
				const driver = await createDriver();
				const entries = Array.from({ length: 1234 }, (_, i) => ({
					id: String(i).padStart(4, '0'),
					metadata: `metadata-${i}`,
				}));
				await writeSnapshot(driver, 'snapshot-1', { docs: entries });
				const reader = await driver.openReader({ snapshot: 'snapshot-1' });

				assertEqual(
					sortById(await reader.entries('docs', { content: false })),
					entries,
					'entries()',
				);
			},
		},
		{
			name: 'replaces the entries of a snapshot written again in development',
			async run() {
				const driver = await createDriver();
				await writeSnapshot(driver, 'dev-1', { docs: [intro, setup] }, true);
				await writeSnapshot(driver, 'dev-1', { docs: [setup] }, true);
				const reader = await driver.openReader({ snapshot: 'dev-1' });

				assertEqual(await reader.entries('docs', { content: true }), [setup], 'entries()');
				assertEqual(await reader.get('docs', 'intro', { content: true }), undefined, 'get()');
			},
		},
		{
			name: 'lists committed snapshots, when the driver implements listSnapshots()',
			async run() {
				const driver = await createDriver();
				if (!driver.listSnapshots) return;
				await writeSnapshot(driver, 'snapshot-1', { docs: [intro] });
				await writeSnapshot(driver, 'dev-1', { docs: [intro] }, true);
				await driver.openWriter({ snapshot: 'snapshot-2', dev: false });

				const listed = await driver.listSnapshots();
				const summary = listed
					.map(({ snapshot, dev, committedAt }) => [snapshot, dev, committedAt instanceof Date])
					.sort(([a], [b]) => String(a).localeCompare(String(b)));
				const expected = [
					['dev-1', true, true],
					['snapshot-1', false, true],
				];
				if (JSON.stringify(summary) !== JSON.stringify(expected)) {
					throw new Error(
						`listSnapshots(): expected ${JSON.stringify(expected)}, received ${JSON.stringify(summary)}`,
					);
				}
			},
		},
		{
			name: 'deletes a snapshot, when the driver implements deleteSnapshot()',
			async run() {
				const driver = await createDriver();
				if (!driver.deleteSnapshot) return;
				await writeSnapshot(driver, 'snapshot-1', { docs: [intro] });
				await writeSnapshot(driver, 'snapshot-2', { docs: [setup] });
				await driver.deleteSnapshot('snapshot-1');

				let entry: StoredEntry | undefined;
				try {
					const reader = await driver.openReader({ snapshot: 'snapshot-1' });
					entry = await reader.get('docs', 'intro', { content: true });
				} catch {
					// Refusing to open a deleted snapshot is allowed
				}
				assertEqual(entry, undefined, 'entry of a deleted snapshot');
				const kept = await driver.openReader({ snapshot: 'snapshot-2' });
				assertEqual(await kept.entries('docs', { content: true }), [setup], 'other snapshot');
				if (driver.listSnapshots) {
					const listed = (await driver.listSnapshots()).map(({ snapshot }) => snapshot);
					assertEqual(listed.includes('snapshot-1'), false, 'listSnapshots() after deleting');
				}
			},
		},
	];
}

async function writeSnapshot(
	driver: CollectionStorageDriver,
	snapshot: string,
	collections: Record<string, StoredEntry[]>,
	dev = false,
) {
	const writer = await driver.openWriter({ snapshot, dev });
	for (const [collection, entries] of Object.entries(collections)) {
		await writer.write(collection, entries);
	}
	await writer.commit();
}

function sortById(entries: StoredEntry[]): StoredEntry[] {
	return [...entries].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Compares entries by their fields, whatever order a driver returns the fields in. */
function assertEqual(actual: unknown, expected: unknown, label: string) {
	const actualJson = JSON.stringify(toEntryFields(actual));
	const expectedJson = JSON.stringify(toEntryFields(expected));
	if (actualJson !== expectedJson) {
		throw new Error(`${label}: expected ${expectedJson}, received ${actualJson}`);
	}
}

function toEntryFields(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(toEntryFields);
	if (value && typeof value === 'object') {
		const { id, metadata, content } = value as Partial<StoredEntry>;
		return [id, metadata, content ?? null];
	}
	return value ?? null;
}
