import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { init, parse } from 'es-module-lexer';

const distRoot = fileURLToPath(new URL('../../../dist/', import.meta.url));

/**
 * Walk the static import graph of a built module, following relative
 * specifiers, and return every visited file.
 */
async function collectModuleGraph(entry: string): Promise<Map<string, string>> {
	await init;
	const visited = new Map<string, string>();
	const queue = [entry];
	while (queue.length > 0) {
		const file = queue.pop()!;
		if (visited.has(file)) continue;
		const source = fs.readFileSync(file, 'utf-8');
		visited.set(file, source);
		const [imports] = parse(source);
		for (const record of imports) {
			const specifier = record.n;
			// Only relative specifiers stay inside the built package; bare and
			// node: specifiers are leaves.
			if (!specifier || !specifier.startsWith('.')) continue;
			queue.push(path.resolve(path.dirname(file), specifier));
		}
	}
	return visited;
}

describe('astro:actions import graph', () => {
	it('contains no reference to es-module-lexer', async () => {
		// `astro:actions` resolves to this entrypoint at runtime. No module it
		// reaches may load `es-module-lexer`: its WebAssembly init runs at
		// module evaluation, which runtimes like Cloudflare Workers disallow.
		// The dev-time actions file check lives in `actions/actions-file.js`,
		// which is not reachable from this graph.
		// https://github.com/withastro/astro/issues/17906
		const entry = path.join(distRoot, 'actions/runtime/entrypoints/server.js');
		const graph = await collectModuleGraph(entry);
		assert.ok(graph.size > 0, 'expected the astro:actions graph to contain modules');
		assert.ok(
			graph.has(path.join(distRoot, 'actions/utils.js')),
			'expected the graph walk to reach the actions runtime helpers',
		);
		for (const [file, source] of graph) {
			assert.ok(
				!source.includes('es-module-lexer'),
				`${path.relative(distRoot, file)} references es-module-lexer`,
			);
		}
	});
});
