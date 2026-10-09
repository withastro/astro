import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	assignRouteWorkers,
	computeRouteUniqueBytes,
	type PrerenderChunk,
} from '../../../dist/core/build/parallel-prerender-affinity.js';

function chunk(
	fileName: string,
	code: string,
	facadeModuleId: string | null = null,
	imports: string[] = [],
): PrerenderChunk {
	return { fileName, code, facadeModuleId, imports, dynamicImports: [] };
}

describe('parallel prerender affinity', () => {
	it('counts only chunks used by one route', () => {
		const chunks = [
			chunk('page-a.mjs', 'aa', '\0virtual:astro:page:src/pages/a@_@astro', [
				'shared.mjs',
				'unique-a.mjs',
			]),
			chunk('page-b.mjs', 'bbb', '\0virtual:astro:page:src/pages/b@_@astro', ['shared.mjs']),
			chunk('shared.mjs', 'shared'),
			chunk('unique-a.mjs', 'unique'),
		];

		assert.deepEqual(
			computeRouteUniqueBytes(chunks),
			new Map([
				['src/pages/a.astro', 8],
				['src/pages/b.astro', 3],
			]),
		);
	});

	it('pins endpoints and routes above the unique-byte threshold', () => {
		const paths = [
			{ route: { component: 'page', type: 'page' } },
			{ route: { component: 'page', type: 'page' } },
			{ route: { component: 'endpoint', type: 'endpoint' } },
			{ route: { component: 'ordinary', type: 'page' } },
		] as any;

		const assignments = assignRouteWorkers(
			paths,
			new Map([
				['page', 300],
				['ordinary', 100],
			]),
			4,
			256,
		);

		assert.deepEqual(assignments.get('page'), new Set([0, 1]));
		assert.deepEqual(assignments.get('endpoint'), new Set([2, 3]));
		assert.equal(assignments.has('ordinary'), false);
	});
});
