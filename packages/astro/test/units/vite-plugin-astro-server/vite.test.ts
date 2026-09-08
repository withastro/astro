import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EnvironmentModuleNode, RunnableDevEnvironment } from 'vite';
import { crawlGraph } from '../../../dist/vite-plugin-astro-server/vite.js';

function createEnvironment(imports: Record<string, string[]>): RunnableDevEnvironment {
	const modules = new Map<string, EnvironmentModuleNode>();
	for (const id of Object.keys(imports)) {
		modules.set(id, {
			id,
			importedModules: new Set(),
			importers: new Set(),
		} as EnvironmentModuleNode);
	}
	for (const [id, dependencies] of Object.entries(imports)) {
		const parent = modules.get(id)!;
		for (const dependency of dependencies) {
			const child = modules.get(dependency)!;
			parent.importedModules.add(child);
			child.importers.add(parent);
		}
	}
	return {
		moduleGraph: {
			getModuleById: (id: string) => modules.get(id),
			getModulesByFile: (id: string) => new Set([modules.get(id)!]),
		},
	} as RunnableDevEnvironment;
}

describe('crawlGraph', () => {
	for (const backEdge of ['\0virtual:shared', '/@id/__x00__virtual:shared']) {
		it(`terminates a cycle through ${JSON.stringify(backEdge)}`, async () => {
			const environment = createEnvironment({
				'/entry.js': ['\0virtual:shared'],
				[backEdge]: [],
				'\0virtual:shared': [backEdge],
			});
			const graph = crawlGraph(environment, '/entry.js', true);
			try {
				assert.equal((await graph.next()).value?.id, '\0virtual:shared');
				assert.deepEqual(await graph.next(), { value: undefined, done: true });
			} finally {
				await graph.return();
			}
		});
	}

	it('visits a shared dependency once across wrapped and unwrapped imports', async () => {
		const environment = createEnvironment({
			'/entry.js': ['/first.js', '/second.js'],
			'/first.js': ['\0virtual:shared'],
			'/second.js': ['/@id/__x00__virtual:shared'],
			'\0virtual:shared': [],
			'/@id/__x00__virtual:shared': [],
		});
		const ids = [];
		for await (const module of crawlGraph(environment, '/entry.js', false)) {
			ids.push(module.id);
		}
		assert.deepEqual(ids, ['/first.js', '\0virtual:shared', '/second.js']);
	});

	it('preserves an unseen wrapped import and crawls its unwrapped module', async () => {
		const environment = createEnvironment({
			'/entry.js': ['/@id/__x00__virtual:shared'],
			'/@id/__x00__virtual:shared': [],
			'\0virtual:shared': ['/style.css'],
			'/style.css': [],
		});
		const ids = [];
		for await (const module of crawlGraph(environment, '/entry.js', false)) {
			ids.push(module.id);
		}
		assert.deepEqual(ids, ['/@id/__x00__virtual:shared', '/style.css']);
	});
});
