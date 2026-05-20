import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { crawlGraph } from '../../../dist/vite-plugin-astro-server/vite.js';

/**
 * Creates a minimal mock of RunnableDevEnvironment for testing crawlGraph.
 */
function createMockEnvironment(modules: Array<{
	id: string;
	file?: string;
	importedModules?: Array<{ id: string; importers: Array<{ id: string }> }>;
}>) {
	const idToModuleMap = new Map<string, any>();
	const fileToModulesMap = new Map<string, Set<any>>();

	for (const mod of modules) {
		const moduleNode = {
			id: mod.id,
			file: mod.file ?? mod.id,
			importedModules: new Set(
				(mod.importedModules ?? []).map((imp) => ({
					id: imp.id,
					importers: new Set(imp.importers.map((i) => ({ id: i.id }))),
					importedModules: new Set(),
				})),
			),
			importers: new Set(),
			ssrModule: {},
		};
		idToModuleMap.set(mod.id, moduleNode);

		const file = mod.file ?? mod.id;
		if (!fileToModulesMap.has(file)) {
			fileToModulesMap.set(file, new Set());
		}
		fileToModulesMap.get(file)!.add(moduleNode);
	}

	return {
		moduleGraph: {
			getModulesByFile(file: string) {
				return fileToModulesMap.get(file);
			},
			getModuleById(id: string) {
				return idToModuleMap.get(id);
			},
			idToModuleMap,
		},
		runner: {
			async import(_id: string) {},
		},
	} as any;
}

describe('crawlGraph', () => {
	it('resolves styles when path casing matches exactly', async () => {
		const env = createMockEnvironment([
			{
				id: '/projects/my-app/src/pages/index.astro',
				importedModules: [
					{
						id: '/projects/my-app/src/styles/global.css',
						importers: [{ id: '/projects/my-app/src/pages/index.astro' }],
					},
				],
			},
		]);

		const results: any[] = [];
		for await (const mod of crawlGraph(
			env,
			'/projects/my-app/src/pages/index.astro',
			true,
		)) {
			results.push(mod);
		}

		assert.equal(results.length, 1);
		assert.equal(results[0].id, '/projects/my-app/src/styles/global.css');
	});

	it('resolves styles when path casing differs (case-insensitive filesystem)', async () => {
		// Simulate: CWD gives lowercase path, but module graph has uppercase
		// e.g. on Windows: d:\projects vs D:\Projects
		const env = createMockEnvironment([
			{
				id: 'D:/Projects/my-app/src/pages/index.astro',
				file: 'D:/Projects/my-app/src/pages/index.astro',
				importedModules: [
					{
						id: 'D:/Projects/my-app/src/styles/global.css',
						importers: [{ id: 'D:/Projects/my-app/src/pages/index.astro' }],
					},
				],
			},
		]);

		// Query with different casing (simulating CWD with different drive letter case)
		const results: any[] = [];
		for await (const mod of crawlGraph(
			env,
			'd:/projects/my-app/src/pages/index.astro',
			true,
		)) {
			results.push(mod);
		}

		assert.equal(results.length, 1, 'Should find CSS module despite path casing difference');
		assert.equal(results[0].id, 'D:/Projects/my-app/src/styles/global.css');
	});

	it('returns no results when path does not match even case-insensitively', async () => {
		const env = createMockEnvironment([
			{
				id: '/projects/my-app/src/pages/index.astro',
				importedModules: [],
			},
		]);

		const results: any[] = [];
		for await (const mod of crawlGraph(
			env,
			'/completely/different/path.astro',
			true,
		)) {
			results.push(mod);
		}

		assert.equal(results.length, 0);
	});
});
