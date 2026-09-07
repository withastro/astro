import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { init, parse } from 'es-module-lexer';

const distRoot = fileURLToPath(new URL('../../../dist/', import.meta.url));
const srcRoot = fileURLToPath(new URL('../../../src/', import.meta.url));

/**
 * Walk the static + dynamic import graph of a built module, following relative
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
			// node: specifiers are leaves (asserted on separately via the source
			// text). Non-literal dynamic imports have no resolvable specifier.
			if (!specifier || !specifier.startsWith('.')) continue;
			queue.push(path.resolve(path.dirname(file), specifier));
		}
	}
	return visited;
}

function* walkSourceFiles(dir: string): Generator<string> {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walkSourceFiles(full);
		} else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
			yield full;
		}
	}
}

describe('render scope edge safety', () => {
	it('the built astro/app graph contains zero occurrences of node:async_hooks', async () => {
		// astro/app resolves to dist/core/app/entrypoints/index.js and is bundled
		// into production edge output. No module reachable from it may reference
		// node:async_hooks — statically, dynamically, or as a bare string.
		const graph = await collectModuleGraph(path.join(distRoot, 'core/app/entrypoints/index.js'));
		assert.ok(graph.size > 0, 'expected the astro/app graph to contain modules');
		assert.ok(
			graph.has(path.join(distRoot, 'core/render-scope/scope.js')),
			'expected the graph walk to reach the render scope modules',
		);
		for (const [file, source] of graph) {
			assert.ok(
				!source.includes('node:async_hooks'),
				`${path.relative(distRoot, file)} references node:async_hooks`,
			);
		}
	});

	it('node-scope.ts has exactly one importer: core/build/default-prerenderer.ts', () => {
		const importers: string[] = [];
		for (const file of walkSourceFiles(srcRoot)) {
			if (file.endsWith(`core${path.sep}render-scope${path.sep}node-scope.ts`)) continue;
			const source = fs.readFileSync(file, 'utf-8');
			if (source.includes('render-scope/node-scope')) {
				importers.push(path.relative(srcRoot, file));
			}
		}
		assert.deepEqual(importers, [path.join('core', 'build', 'default-prerenderer.ts')]);
	});
});
