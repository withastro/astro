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

	it('fails for a driver that shows uncommitted snapshots', async () => {
		const leaky = () => {
			const driver = createMemoryStorageDriver();
			return {
				...driver,
				async openWriter(context: { snapshot: string; dev: boolean }) {
					const writer = await driver.openWriter(context);
					return {
						async write(collection: string, entries: any[]) {
							await writer.write(collection, entries);
							await writer.commit();
						},
						commit: writer.commit,
					};
				},
			};
		};
		const test = createStorageDriverTests(leaky).find((t) =>
			t.name.includes('before it is committed'),
		)!;

		await assert.rejects(test.run(), /uncommitted snapshot/);
	});
});
