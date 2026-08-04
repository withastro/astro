import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isTransitiveImporterOf } from '../../../dist/core/middleware/vite-plugin.js';

/**
 * Minimal mock of EnvironmentModuleNode with just the fields
 * that isTransitiveImporterOf uses (id and importers).
 */
function createMockNode(id: string, importers: any[] = []): any {
	return { id, importers };
}

describe('isTransitiveImporterOf', () => {
	it('returns true when the module is directly imported by the target', () => {
		const target = createMockNode('virtual:middleware');
		const mod = createMockNode('utils/misc.ts', [target]);
		assert.ok(isTransitiveImporterOf(mod, 'virtual:middleware'));
	});

	it('returns true when the module is transitively imported by the target', () => {
		const target = createMockNode('virtual:middleware');
		const middleware = createMockNode('middleware.ts', [target]);
		const mod = createMockNode('utils/misc.ts', [middleware]);
		assert.ok(isTransitiveImporterOf(mod, 'virtual:middleware'));
	});

	it('returns false when the module is not in the import chain of the target', () => {
		const unrelated = createMockNode('pages/index.astro');
		const mod = createMockNode('utils/misc.ts', [unrelated]);
		assert.ok(!isTransitiveImporterOf(mod, 'virtual:middleware'));
	});

	it('handles circular imports without infinite recursion', () => {
		const a = createMockNode('a.ts');
		const b = createMockNode('b.ts', [a]);
		// Create circular reference: a imports b, b imports a
		a.importers = [b];
		assert.ok(!isTransitiveImporterOf(a, 'virtual:middleware'));
	});

	it('returns false when the module has no importers', () => {
		const mod = createMockNode('utils/misc.ts');
		assert.ok(!isTransitiveImporterOf(mod, 'virtual:middleware'));
	});

	it('returns true through deeply nested import chains', () => {
		const target = createMockNode('virtual:middleware');
		const level1 = createMockNode('middleware.ts', [target]);
		const level2 = createMockNode('utils/index.ts', [level1]);
		const level3 = createMockNode('utils/helpers.ts', [level2]);
		assert.ok(isTransitiveImporterOf(level3, 'virtual:middleware'));
	});
});
