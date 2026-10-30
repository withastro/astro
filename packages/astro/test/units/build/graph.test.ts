import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getTopLevelPageModuleInfos } from '../../../dist/core/build/graph.js';

type MockModule = { importers: string[]; dynamicImporters?: string[] };

function createModuleGraph(modules: Record<string, MockModule>) {
	return {
		getModuleInfo(id: string) {
			const mod = modules[id];
			if (!mod) return null;
			return { id, importers: mod.importers, dynamicImporters: mod.dynamicImporters ?? [] } as any;
		},
	};
}

describe('getTopLevelPageModuleInfos', () => {
	it('does not walk past a page entry into pages that share runtime modules', () => {
		// `/src/pages/admin.astro` is reachable from `/src/pages/index.astro` through the pages map
		// and manifest, which runtime modules such as `astro:i18n` import.
		const ctx = createModuleGraph({
			'/src/components/Studio.astro': { importers: ['/src/pages/admin.astro'] },
			'/src/pages/admin.astro': { importers: ['\0virtual:astro:page:src/pages/admin@_@astro'] },
			'\0virtual:astro:page:src/pages/admin@_@astro': { importers: ['\0virtual:astro:pages'] },
			'\0virtual:astro:pages': { importers: ['\0virtual:astro:manifest'] },
			'\0virtual:astro:manifest': { importers: ['/astro/dist/virtual-modules/i18n.js'] },
			'/astro/dist/virtual-modules/i18n.js': { importers: ['/src/layouts/Layout.astro'] },
			'/src/layouts/Layout.astro': { importers: ['/src/pages/index.astro'] },
			'/src/pages/index.astro': { importers: ['\0virtual:astro:page:src/pages/index@_@astro'] },
			'\0virtual:astro:page:src/pages/index@_@astro': { importers: ['\0virtual:astro:pages'] },
		});

		const pages = getTopLevelPageModuleInfos('/src/components/Studio.astro', ctx).map(
			(info) => info.id,
		);
		assert.deepEqual(pages, ['/src/pages/admin.astro']);
	});

	it('finds every page that imports a shared component', () => {
		const ctx = createModuleGraph({
			'/src/components/Nav.astro': {
				importers: ['/src/pages/index.astro', '/src/pages/about.astro'],
			},
			'/src/pages/index.astro': { importers: ['\0virtual:astro:page:src/pages/index@_@astro'] },
			'/src/pages/about.astro': { importers: ['\0virtual:astro:page:src/pages/about@_@astro'] },
			'\0virtual:astro:page:src/pages/index@_@astro': { importers: [] },
			'\0virtual:astro:page:src/pages/about@_@astro': { importers: [] },
		});

		const pages = getTopLevelPageModuleInfos('/src/components/Nav.astro', ctx).map(
			(info) => info.id,
		);
		assert.deepEqual(pages, ['/src/pages/index.astro', '/src/pages/about.astro']);
	});
});
