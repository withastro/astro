import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	buildImporterGraphFromModuleInfo,
	computeInTreeAncestors,
} from '../../../../dist/core/head-propagation/graph.js';

describe('head propagation graph', () => {
	it('computes in-tree ancestors for a linear chain', () => {
		const importerGraph = new Map([
			['leaf', new Set(['parent'])],
			['parent', new Set(['page'])],
			['page', new Set()],
		]);
		const result = computeInTreeAncestors({
			seeds: ['leaf'],
			importerGraph,
		});
		assert.deepEqual(Array.from(result), ['leaf', 'parent', 'page']);
	});

	it('supports multiple seeds and cycles', () => {
		const importerGraph = new Map([
			['a', new Set(['b'])],
			['b', new Set(['a', 'page'])],
			['c', new Set(['page'])],
			['page', new Set()],
		]);
		const result = computeInTreeAncestors({
			seeds: ['a', 'c'],
			importerGraph,
		});
		assert.equal(result.has('a'), true);
		assert.equal(result.has('b'), true);
		assert.equal(result.has('c'), true);
		assert.equal(result.has('page'), true);
	});

	it('stops traversal at boundary predicate', () => {
		const importerGraph = new Map([
			['leaf', new Set(['boundary'])],
			['boundary', new Set(['page'])],
			['page', new Set()],
		]);
		const result = computeInTreeAncestors({
			seeds: ['leaf'],
			importerGraph,
			stopAt: (id) => id === 'boundary',
		});
		assert.deepEqual(Array.from(result), ['leaf']);
	});

	it('builds importer graph from module info provider', () => {
		const provider = (id) => {
			if (id === 'a') return { importers: ['page'], dynamicImporters: [] };
			if (id === 'b') return { importers: [], dynamicImporters: ['page'] };
			if (id === 'page') return { importers: [], dynamicImporters: [] };
			return null;
		};

		const graph = buildImporterGraphFromModuleInfo(['a', 'b', 'page'], provider);
		assert.deepEqual(Array.from(graph.get('a') ?? []), ['page']);
		assert.deepEqual(Array.from(graph.get('b') ?? []), ['page']);
	});
});
