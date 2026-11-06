import assert from 'node:assert/strict';
import * as nodeFs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
	createStorageHandles,
	readsSnapshotsAtRuntime,
} from '../../../dist/content/storage-handles.js';
import { createMemoryStorageDriver } from './test-helpers.ts';

async function setup() {
	const dotAstroDir = pathToFileURL(
		`${nodeFs.mkdtempSync(join(tmpdir(), 'astro-storage-handles-'))}/`,
	);
	const driver = createMemoryStorageDriver();
	for (const snapshot of ['build-1', 'build-2']) {
		const writer = await driver.openWriter({ snapshot, dev: false });
		await writer.write('docs', []);
		await writer.commit();
	}
	nodeFs.writeFileSync(
		new URL('collection-storage.json', dotAstroDir),
		JSON.stringify({
			drivers: [
				{ entrypoint: 'memory-driver', snapshot: 'build-2', collections: ['docs', 'guides'] },
			],
		}),
	);
	return { dotAstroDir, driver };
}

describe('createStorageHandles', () => {
	it('returns a handle per descriptor of the build', async () => {
		const { dotAstroDir, driver } = await setup();
		const [handle, ...rest] = await createStorageHandles({
			fs: nodeFs,
			dotAstroDir,
			loadDriver: async () => driver,
			readAtRuntime: true,
		});

		assert.equal(rest.length, 0);
		assert.deepEqual(handle.collections, ['docs', 'guides']);
		assert.equal(handle.snapshot, 'build-2');
		assert.equal(handle.readAtRuntime, true);
		assert.deepEqual((await handle.listSnapshots!()).map(({ snapshot }) => snapshot).sort(), [
			'build-1',
			'build-2',
		]);
	});

	it('deletes earlier snapshots, but not the one the server reads', async () => {
		const { dotAstroDir, driver } = await setup();
		const [handle] = await createStorageHandles({
			fs: nodeFs,
			dotAstroDir,
			loadDriver: async () => driver,
			readAtRuntime: true,
		});

		await handle.deleteSnapshot!('build-1');
		await assert.rejects(handle.deleteSnapshot!('build-2'), /CollectionStorageSnapshotInUse/);
		assert.deepEqual(
			(await driver.listSnapshots()).map(({ snapshot }) => snapshot),
			['build-2'],
		);
	});

	it('deletes the snapshot of the build when nothing reads it at runtime', async () => {
		const { dotAstroDir, driver } = await setup();
		const [handle] = await createStorageHandles({
			fs: nodeFs,
			dotAstroDir,
			loadDriver: async () => driver,
			readAtRuntime: false,
		});

		await handle.deleteSnapshot!('build-2');
		assert.deepEqual(
			(await driver.listSnapshots()).map(({ snapshot }) => snapshot),
			['build-1'],
		);
	});

	it('leaves out the methods the driver does not implement', async () => {
		const { dotAstroDir, driver } = await setup();
		const { listSnapshots: _list, deleteSnapshot: _delete, ...minimal } = driver;
		const [handle] = await createStorageHandles({
			fs: nodeFs,
			dotAstroDir,
			loadDriver: async () => minimal,
			readAtRuntime: true,
		});

		assert.equal(handle.listSnapshots, undefined);
		assert.equal(handle.deleteSnapshot, undefined);
	});

	it('returns no handles when no collection has a storage driver', async () => {
		const dotAstroDir = pathToFileURL(
			`${nodeFs.mkdtempSync(join(tmpdir(), 'astro-storage-handles-'))}/`,
		);
		assert.deepEqual(
			await createStorageHandles({
				fs: nodeFs,
				dotAstroDir,
				loadDriver: async () => assert.fail('no driver should be loaded'),
				readAtRuntime: true,
			}),
			[],
		);
	});
});

describe('readsSnapshotsAtRuntime', () => {
	const server = {
		buildOutput: 'server',
		config: { image: { endpoint: { route: '/_image' } } },
	} as any;
	const route = (fields: Record<string, unknown>) =>
		({
			prerender: false,
			origin: 'project',
			route: '/page',
			component: 'src/pages/page.astro',
			...fields,
		}) as any;

	it('is false for static builds', () => {
		assert.equal(readsSnapshotsAtRuntime({ ...server, buildOutput: 'static' }, [route({})]), false);
	});

	it('is false when every page is prerendered', () => {
		assert.equal(readsSnapshotsAtRuntime(server, [route({ prerender: true })]), false);
	});

	it('ignores the internal routes that never run project code', () => {
		const internal = [
			route({ origin: 'internal', route: '/_image', component: 'astro/assets/endpoint/node' }),
			route({ origin: 'internal', route: '/404', component: 'astro-default-404.astro' }),
		];
		assert.equal(readsSnapshotsAtRuntime(server, internal), false);
	});

	it('is true for pages and internal routes running project code on demand', () => {
		assert.equal(readsSnapshotsAtRuntime(server, [route({})]), true);
		assert.equal(
			readsSnapshotsAtRuntime(server, [
				route({
					origin: 'internal',
					route: '/_server-islands/[name]',
					component: 'server-islands',
				}),
			]),
			true,
		);
	});
});
