import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getTopLevelPageModuleInfos } from '../../../dist/core/build/graph.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../../dist/vite-plugin-pages/const.js';

describe('getTopLevelPageModuleInfos', () => {
	it('attributes components to their owning page and stops before virtual page manifest links', () => {
		const page1Id = '/src/pages/admin.astro';
		const page2Id = '/src/pages/index.astro';
		const componentId = '/src/components/Studio.tsx';

		const virtualPage1Id = `${VIRTUAL_PAGE_RESOLVED_MODULE_ID}src/pages/admin.astro`;
		const virtualPage2Id = `${VIRTUAL_PAGE_RESOLVED_MODULE_ID}src/pages/index.astro`;
		const virtualPagesId = '\0virtual:astro:pages';
		const virtualManifestId = '\0virtual:astro:manifest';
		const runtimeI18nId = '/node_modules/astro/dist/virtual-modules/i18n.js';

		const moduleGraph: Record<
			string,
			{ id: string; importers: string[]; dynamicImporters: string[] }
		> = {
			[componentId]: {
				id: componentId,
				importers: [page1Id],
				dynamicImporters: [],
			},
			[page1Id]: {
				id: page1Id,
				importers: [virtualPage1Id],
				dynamicImporters: [],
			},
			[virtualPage1Id]: {
				id: virtualPage1Id,
				importers: [virtualPagesId],
				dynamicImporters: [],
			},
			[virtualPagesId]: {
				id: virtualPagesId,
				importers: [virtualManifestId],
				dynamicImporters: [],
			},
			[virtualManifestId]: {
				id: virtualManifestId,
				importers: [runtimeI18nId],
				dynamicImporters: [],
			},
			[runtimeI18nId]: {
				id: runtimeI18nId,
				importers: [page2Id],
				dynamicImporters: [],
			},
			[page2Id]: {
				id: page2Id,
				importers: [virtualPage2Id],
				dynamicImporters: [],
			},
			[virtualPage2Id]: {
				id: virtualPage2Id,
				importers: [virtualPagesId],
				dynamicImporters: [],
			},
		};

		const ctx = {
			getModuleInfo(id: string) {
				const mod = moduleGraph[id];
				if (!mod) return null;
				return {
					id: mod.id,
					importers: mod.importers,
					dynamicImporters: mod.dynamicImporters,
					importedIds: [],
					dynamicallyImportedIds: [],
				} as any;
			},
		};

		const pages = getTopLevelPageModuleInfos(componentId, ctx);
		assert.equal(pages.length, 1);
		assert.equal(pages[0]?.id, page1Id);
	});
});
