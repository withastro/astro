import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServerIslandsState } from '../../../dist/core/server-islands/shared-state.js';

describe('ServerIslandsState', () => {
	it('tracks island discovery and deduplicates by resolved path', () => {
		const state = new ServerIslandsState();

		assert.equal(state.hasIslands(), false);

		const first = state.discover({
			resolvedPath: '/src/components/Island.astro',
			localName: 'Island',
			specifier: '/src/components/Island.astro',
			importer: '/src/pages/index.astro',
		});

		const duplicate = state.discover({
			resolvedPath: '/src/components/Island.astro',
			localName: 'IslandRenamed',
			specifier: '/src/components/Island.astro',
			importer: '/src/pages/other.astro',
		});

		assert.equal(state.hasIslands(), true);
		assert.equal(first.islandName, 'Island');
		assert.deepEqual(duplicate, first);
		assert.equal(Array.from(state.getDiscoveredIslands()).length, 1);
	});

	it('does not deduplicate when resolved paths differ', () => {
		const state = new ServerIslandsState();

		const first = state.discover({
			resolvedPath: '/src/components/IslandA.astro',
			localName: 'Island',
			specifier: './Island.astro',
			importer: '/src/pages/index.astro',
		});

		const second = state.discover({
			resolvedPath: '/src/components/IslandB.astro',
			localName: 'Island',
			specifier: './Island.astro',
			importer: '/src/pages/other.astro',
		});

		assert.notDeepEqual(second, first);
		assert.equal(Array.from(state.getDiscoveredIslands()).length, 2);
	});

	it('generates unique island names and map sources', () => {
		const state = new ServerIslandsState();

		state.discover({
			resolvedPath: '/src/components/Island.astro',
			localName: 'Island',
			specifier: '/src/components/Island.astro',
			importer: '/src/pages/index.astro',
		});
		const second = state.discover({
			resolvedPath: '/src/components/Island2.astro',
			localName: 'Island',
			specifier: '/src/components/Island2.astro',
			importer: '/src/pages/index.astro',
		});

		assert.equal(second.islandName, 'Island1');

		const discoveredMapSource = state.createImportMapSourceFromDiscovered((fileName) => fileName);
		assert.ok(
			discoveredMapSource.includes('["Island", () => import("/src/components/Island.astro")]'),
		);
		assert.ok(
			discoveredMapSource.includes('["Island1", () => import("/src/components/Island2.astro")]'),
		);

		const nameMapSource = state.createNameMapSource();
		assert.ok(nameMapSource.includes('/src/components/Island.astro'));
		assert.ok(nameMapSource.includes('Island1'));
	});

	it('creates import map source from rollup reference ids', () => {
		const state = new ServerIslandsState();

		state.discover({
			resolvedPath: '/src/components/Island.astro',
			localName: 'Island',
			specifier: '/src/components/Island.astro',
			importer: '/src/pages/index.astro',
		});
		state.setReferenceId('/src/components/Island.astro', 'chunk-ref-1');

		const mapSource = state.createImportMapSourceFromReferences(
			(referenceId) => (referenceId === 'chunk-ref-1' ? 'chunks/island.mjs' : 'chunks/missing.mjs'),
			(fileName) => `./${fileName}`,
		);

		assert.ok(mapSource.includes('["Island", () => import("./chunks/island.mjs")]'));
	});
});
