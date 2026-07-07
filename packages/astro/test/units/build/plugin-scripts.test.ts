import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	chunkHasDynamicImports,
	shouldInlineScriptChunk,
	type ScriptChunkInfo,
} from '../../../dist/core/build/plugins/plugin-scripts.js';

const scriptModuleId = '/src/Component.astro?astro&type=script&index=0&lang.ts';

function createChunk(overrides: Partial<ScriptChunkInfo> = {}): ScriptChunkInfo {
	return {
		code: 'console.log("hello");',
		facadeModuleId: scriptModuleId,
		fileName: '_astro/Component.js',
		imports: [],
		dynamicImports: [],
		moduleIds: [scriptModuleId],
		...overrides,
	};
}

function createGetModuleInfo(dynamicImportsById: Record<string, string[]> = {}) {
	return (id: string) => ({ dynamicallyImportedIds: dynamicImportsById[id] ?? [] }) as any;
}

describe('pluginScripts', () => {
	it('detects external dynamic imports from module info when output dynamicImports is empty', () => {
		const chunk = createChunk({
			moduleIds: ['\0vite/preload-helper.js', scriptModuleId],
		});

		assert.equal(
			chunkHasDynamicImports(chunk, createGetModuleInfo({ [scriptModuleId]: ['/test.js'] })),
			true,
		);
	});

	it('does not inline discovered script chunks with dynamic imports in module info', () => {
		const chunk = createChunk({
			moduleIds: ['\0vite/preload-helper.js', scriptModuleId],
		});

		assert.equal(
			shouldInlineScriptChunk(chunk, {
				discoveredScripts: new Set([scriptModuleId]),
				importedIds: new Set(),
				assetInlineLimit: 4096,
				getModuleInfo: createGetModuleInfo({ [scriptModuleId]: ['/test.js'] }),
			}),
			false,
		);
	});

	it('inlines discovered script chunks that are unimported and have no imports', () => {
		assert.equal(
			shouldInlineScriptChunk(createChunk(), {
				discoveredScripts: new Set([scriptModuleId]),
				importedIds: new Set(),
				assetInlineLimit: 4096,
				getModuleInfo: createGetModuleInfo(),
			}),
			true,
		);
	});
});
