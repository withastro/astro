import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createStorageDriverTests } from '../../../dist/content/storage-driver-tests.js';
import { createMemoryStorageDriver } from './test-helpers.ts';

describe('createStorageDriverTests', () => {
	describe('with a conforming driver', () => {
		for (const test of createStorageDriverTests(() => createMemoryStorageDriver())) {
			it(test.name, test.run);
		}
	});

	it('fails for a driver that ignores the snapshot ID', async () => {
		const shared = () => {
			const driver = createMemoryStorageDriver();
			return {
				...driver,
				openWriter: ({ dev }: { snapshot: string; dev: boolean }) =>
					driver.openWriter({ snapshot: 'shared', dev }),
				openReader: (_context: { snapshot: string }) => driver.openReader({ snapshot: 'shared' }),
			};
		};
		const test = createStorageDriverTests(shared).find((t) => t.name === 'keeps snapshots apart')!;

		await assert.rejects(test.run(), /^Error: first:/);
	});
});
