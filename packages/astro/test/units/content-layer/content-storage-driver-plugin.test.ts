import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { vitePluginContentStorageDriver } from '../../../dist/content/vite-plugin-content-storage-driver.js';
import { createMinimalSettings, createTempDir } from './test-helpers.ts';

const RESOLVED_ID = '\0virtual:astro:content-storage-driver';

function load(collectionStorage: unknown, resolve: (id: string) => Promise<unknown>) {
	const settings = createMinimalSettings(createTempDir(), {
		config: { experimental: { collectionStorage } },
	});
	const plugin = vitePluginContentStorageDriver({ settings });
	return (plugin.load as any).handler.call({ resolve }, RESOLVED_ID);
}

describe('vitePluginContentStorageDriver', () => {
	it('exports undefined when no driver is configured', async () => {
		const resolve = async () => assert.fail('should not resolve');
		assert.deepEqual(await load(undefined, resolve), { code: 'export default undefined;' });
		assert.deepEqual(await load({ type: 'external' }, resolve), {
			code: 'export default undefined;',
		});
	});

	it('creates the driver once, with its config', async () => {
		const dir = createTempDir();
		const driverFile = new URL('driver.mjs', dir);
		await writeFile(
			driverFile,
			'export const calls = []; export default (config) => { calls.push(config); return { config }; };',
		);
		const { code } = await load(
			{ type: 'external', driver: { entrypoint: 'my-driver', config: { url: 'file:test.db' } } },
			async (id) => {
				assert.equal(id, 'my-driver');
				// A file URL, so Node can import the generated module on every platform
				return { id: driverFile.href };
			},
		);
		const moduleFile = new URL('virtual.mjs', dir);
		await writeFile(moduleFile, code);

		const { default: getDriver } = await import(moduleFile.href);
		const { calls } = await import(driverFile.href);

		assert.equal(await getDriver(), await getDriver());
		assert.deepEqual(calls, [{ url: 'file:test.db' }]);
	});

	it('throws when the driver cannot be resolved', async () => {
		await assert.rejects(
			load({ type: 'external', driver: { entrypoint: 'missing' } }, async () => null),
			{ name: 'ContentStorageDriverNotFound' },
		);
	});
});
