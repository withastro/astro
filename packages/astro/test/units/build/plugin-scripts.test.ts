import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	chunkHasDynamicImports,
	shouldInlineScriptChunk,
	type ScriptChunkInfo,
} from '../../../dist/core/build/plugins/plugin-scripts.js';

const scriptModuleId = '/src/Component.astro?astro&type=script&index=0&lang.ts';
const preloadHelperId = '\0vite/preload-helper.js';

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
			moduleIds: [preloadHelperId, scriptModuleId],
		});

		assert.equal(
			chunkHasDynamicImports(chunk, createGetModuleInfo({ [scriptModuleId]: ['/test.js'] })),
			true,
		);
	});

	it('does not inline discovered script chunks with dynamic imports in module info', () => {
		const chunk = createChunk({
			moduleIds: [preloadHelperId, scriptModuleId],
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

	it('detects dynamic imports skipped by `/* @vite-ignore */`', () => {
		// Rolldown records neither `dynamicImports` nor `dynamicallyImportedIds`
		// for an import annotated with `@vite-ignore`, so the only trace it leaves
		// is the preload helper module that Vite pulls into the chunk.
		const chunk = createChunk({
			moduleIds: [preloadHelperId, scriptModuleId],
		});

		assert.equal(chunkHasDynamicImports(chunk, createGetModuleInfo()), true);

		assert.equal(
			shouldInlineScriptChunk(chunk, {
				discoveredScripts: new Set([scriptModuleId]),
				importedIds: new Set(),
				assetInlineLimit: 4096,
				getModuleInfo: createGetModuleInfo(),
			}),
			false,
		);
	});
});
