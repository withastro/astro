import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { pluginIncremental } from '../../../dist/core/build/plugins/plugin-incremental.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../../dist/vite-plugin-pages/const.js';

const ROOT = new URL('file:///project/');
const PAGE_ID = '/project/src/pages/[slug].astro';
const COMPONENT = 'src/pages/[slug].astro';
const RED = '/project/src/assets/red.png';
const BLUE = '/project/src/assets/blue.png';
const VIDEO = '/project/src/assets/clip.mp4';

const HANDLE_ONE = 'VRAku6fjghkApIISiBWPzg';
const HANDLE_TWO = 'WPGYjwIlzWVNM1bYhOc83w';

function moduleInfo(
	id: string,
	{
		code = '',
		importedIds = [] as string[],
		importers = [] as string[],
		dynamicallyImportedIds = [] as string[],
	} = {},
) {
	return {
		id,
		code,
		importedIds,
		importers,
		dynamicallyImportedIds,
		dynamicImporters: [] as string[],
		meta: {},
	};
}

function imageCode(handle: string) {
	return `export default {"src":"__ASTRO_ASSET_IMAGE__${handle}__","width":1,"height":1}`;
}

function assetCode(handle: string) {
	return `export default "__VITE_ASSET__${handle}__"`;
}

function pluginContext(
	codeByModule: Record<string, string>,
	fileNames: Record<string, string>,
	importedIds: string[],
) {
	const modules = new Map([
		[
			PAGE_ID,
			moduleInfo(PAGE_ID, {
				code: 'export default page',
				importedIds,
				importers: [VIRTUAL_PAGE_RESOLVED_MODULE_ID],
			}),
		],
		...importedIds.map((id) => [id, moduleInfo(id, { code: codeByModule[id] })] as const),
	]);

	return {
		environment: { name: 'prerender' },
		getModuleIds: () => modules.keys(),
		getModuleInfo: (id: string) => modules.get(id) ?? null,
		getFileName: (handle: string) => {
			const fileName = fileNames[handle];
			if (!fileName) throw new Error(`Unknown reference id ${handle}`);
			return fileName;
		},
	};
}

function dependencyHash(
	codeByModule: Record<string, string>,
	fileNames: Record<string, string>,
	importedIds = Object.keys(codeByModule),
) {
	const internals = { pagesByViteID: new Map([[PAGE_ID, { component: COMPONENT }]]) } as any;
	const plugin = pluginIncremental(internals, ROOT) as any;
	plugin.generateBundle.call(pluginContext(codeByModule, fileNames, importedIds));
	return internals.pageDependencyHashes.get(COMPONENT);
}

function diagnosticsGraph(
	codeByModule: Record<string, string>,
	fileNames: Record<string, string>,
	importedIds: string[],
	dynamicallyImportedIds: string[] = [],
	moduleImports: Record<string, { importedIds?: string[]; dynamicallyImportedIds?: string[] }> = {},
) {
	const internals = { pagesByViteID: new Map([[PAGE_ID, { component: COMPONENT }]]) } as any;
	const plugin = pluginIncremental(internals, ROOT) as any;
	const modules = new Map([
		[
			PAGE_ID,
			moduleInfo(PAGE_ID, {
				code: 'export default page',
				importedIds,
				dynamicallyImportedIds,
				importers: [VIRTUAL_PAGE_RESOLVED_MODULE_ID],
			}),
		],
		...[...importedIds, ...dynamicallyImportedIds].map((id) => {
			const overrides = moduleImports[id] ?? {};
			return [
				id,
				moduleInfo(id, {
					code: codeByModule[id],
					importedIds: overrides.importedIds ?? [],
					dynamicallyImportedIds: overrides.dynamicallyImportedIds ?? [],
				}),
			] as const;
		}),
	]);
	plugin.generateBundle.call({
		environment: { name: 'prerender' },
		getModuleIds: () => modules.keys(),
		getModuleInfo: (id: string) => modules.get(id) ?? null,
		getFileName: (handle: string) => {
			const fileName = fileNames[handle];
			if (!fileName) throw new Error(`Unknown reference id ${handle}`);
			return fileName;
		},
	});
	return internals.incrementalDiagnosticsPrerender as Record<string, any>;
}

describe('pluginIncremental', () => {
	describe('dependency hash', () => {
		it('is stable when the same images are emitted with different handles', () => {
			const first = dependencyHash(
				{ [RED]: imageCode(HANDLE_ONE), [BLUE]: imageCode(HANDLE_TWO) },
				{ [HANDLE_ONE]: '_astro/red.aaaa.png', [HANDLE_TWO]: '_astro/blue.bbbb.png' },
			);
			const second = dependencyHash(
				{ [RED]: imageCode(HANDLE_TWO), [BLUE]: imageCode(HANDLE_ONE) },
				{ [HANDLE_TWO]: '_astro/red.aaaa.png', [HANDLE_ONE]: '_astro/blue.bbbb.png' },
			);
			assert.equal(first, second);
		});

		it('is stable when the same non-image assets are emitted with different handles', () => {
			const first = dependencyHash(
				{ [RED]: imageCode(HANDLE_ONE), [VIDEO]: assetCode(HANDLE_TWO) },
				{ [HANDLE_ONE]: '_astro/red.aaaa.png', [HANDLE_TWO]: '_astro/clip.cccc.mp4' },
			);
			const second = dependencyHash(
				{ [RED]: imageCode(HANDLE_TWO), [VIDEO]: assetCode(HANDLE_ONE) },
				{ [HANDLE_TWO]: '_astro/red.aaaa.png', [HANDLE_ONE]: '_astro/clip.cccc.mp4' },
			);
			assert.equal(first, second);
		});

		it('changes when an imported image resolves to a different file name', () => {
			const code = { [RED]: imageCode(HANDLE_ONE), [BLUE]: imageCode(HANDLE_TWO) };
			const first = dependencyHash(code, {
				[HANDLE_ONE]: '_astro/red.aaaa.png',
				[HANDLE_TWO]: '_astro/blue.bbbb.png',
			});
			const second = dependencyHash(code, {
				[HANDLE_ONE]: '_astro/red.dddd.png',
				[HANDLE_TWO]: '_astro/blue.bbbb.png',
			});
			assert.notEqual(first, second);
		});

		it('keeps hashing when a handle does not resolve to a file', () => {
			const code = { [RED]: imageCode(HANDLE_ONE) };
			const first = dependencyHash(code, {});
			const second = dependencyHash(code, {});
			assert.equal(first, second);
			assert.match(first, /^[0-9a-f]{64}$/);
		});

		describe('CSS modules (#17704)', () => {
			const tmpDir = mkdtempSync(join(tmpdir(), 'astro-css-test-'));
			after(() => rmSync(tmpDir, { recursive: true, force: true }));

			it('changes when a CSS file on disk is modified', () => {
				const cssPath = join(tmpDir, 'global.css');
				writeFileSync(cssPath, 'body { color: red; }');
				const first = dependencyHash({ [cssPath]: '' }, {});

				writeFileSync(cssPath, 'body { color: blue; }');
				const second = dependencyHash({ [cssPath]: '' }, {});

				assert.notEqual(first, second);
			});

			it('is stable for an unchanged CSS file', () => {
				const cssPath = join(tmpDir, 'styles.css');
				writeFileSync(cssPath, 'body { color: green; }');

				const first = dependencyHash({ [cssPath]: '' }, {});
				const second = dependencyHash({ [cssPath]: '' }, {});

				assert.equal(first, second);
			});
		});
	});

	describe('diagnostics graph', () => {
		const MODULE = '/project/src/utils/format.ts';

		it('records the page root and module fingerprints', () => {
			const diagnostics = diagnosticsGraph({ [MODULE]: 'export const fmt = 1;' }, {}, [MODULE]);
			assert.deepEqual(diagnostics.routeRoots[COMPONENT], [PAGE_ID]);
			assert.match(diagnostics.modules[PAGE_ID].fingerprint, /^[0-9a-f]{64}$/);
			assert.match(diagnostics.modules[MODULE].fingerprint, /^[0-9a-f]{64}$/);
		});

		it('keeps fingerprints stable across unstable asset handles', () => {
			const first = diagnosticsGraph(
				{ [RED]: imageCode(HANDLE_ONE), [BLUE]: imageCode(HANDLE_TWO) },
				{ [HANDLE_ONE]: '_astro/red.aaaa.png', [HANDLE_TWO]: '_astro/blue.bbbb.png' },
				[RED, BLUE],
			);
			const second = diagnosticsGraph(
				{ [RED]: imageCode(HANDLE_TWO), [BLUE]: imageCode(HANDLE_ONE) },
				{ [HANDLE_TWO]: '_astro/red.aaaa.png', [HANDLE_ONE]: '_astro/blue.bbbb.png' },
				[RED, BLUE],
			);
			assert.equal(first.modules[RED].fingerprint, second.modules[RED].fingerprint);
			assert.equal(first.modules[BLUE].fingerprint, second.modules[BLUE].fingerprint);
		});

		it('changes a fingerprint when the module code changes', () => {
			const first = diagnosticsGraph({ [MODULE]: 'export const a = 1;' }, {}, [MODULE]);
			const second = diagnosticsGraph({ [MODULE]: 'export const a = 2;' }, {}, [MODULE]);
			assert.notEqual(first.modules[MODULE].fingerprint, second.modules[MODULE].fingerprint);
		});

		it('changes a fingerprint when an import edge changes', () => {
			const OTHER = '/project/src/utils/other.ts';
			const EXTRA = '/project/src/utils/extra.ts';
			const first = diagnosticsGraph(
				{ [MODULE]: 'x', [OTHER]: 'y', [EXTRA]: 'z' },
				{},
				[MODULE],
				[],
				{ [MODULE]: { importedIds: [OTHER] } },
			);
			const second = diagnosticsGraph(
				{ [MODULE]: 'x', [OTHER]: 'y', [EXTRA]: 'z' },
				{},
				[MODULE],
				[],
				{ [MODULE]: { importedIds: [OTHER, EXTRA] } },
			);
			assert.notEqual(first.modules[MODULE].fingerprint, second.modules[MODULE].fingerprint);
		});

		it('captures static and dynamic import edges', () => {
			const STATIC = '/project/src/static.ts';
			const DYNAMIC = '/project/src/dynamic.ts';
			const diagnostics = diagnosticsGraph(
				{ [STATIC]: 's', [DYNAMIC]: 'd' },
				{},
				[STATIC],
				[DYNAMIC],
			);
			assert.deepEqual(diagnostics.modules[PAGE_ID].importedIds, [STATIC]);
			assert.deepEqual(diagnostics.modules[PAGE_ID].dynamicallyImportedIds, [DYNAMIC]);
		});

		it('records content render roots for propagated asset modules', () => {
			const RENDER = '/project/src/content/docs/a.mdx';
			const PROPAGATED = `${RENDER}?astroPropagatedAssets`;
			const diagnostics = diagnosticsGraph(
				{ [RENDER]: 'export default {};', [PROPAGATED]: 'import x from "./a.mdx";' },
				{},
				[RENDER, PROPAGATED],
			);
			assert.deepEqual(diagnostics.contentRoots['src/content/docs/a.mdx'], [RENDER]);
		});

		it('records client entrypoint roots for consuming routes', () => {
			const internals = {
				pagesByViteID: new Map([[PAGE_ID, { component: COMPONENT }]]),
				pageDependencyHashes: new Map([[COMPONENT, 'base']]),
				discoveredClientOnlyComponents: new Map([
					['/@fs/project/src/components/Search.tsx', ['default']],
				]),
				pagesByClientOnly: new Map([
					['/@fs/project/src/components/Search.tsx', new Set([{ component: COMPONENT }])],
				]),
				discoveredScripts: new Set(),
				pagesByScriptId: new Map(),
				incrementalDiagnosticsPrerender: {
					modules: {},
					routeRoots: {},
					contentRoots: {},
					routeDependencyHashes: { [COMPONENT]: 'base' },
				},
			} as any;
			const plugin = pluginIncremental(internals, ROOT) as any;
			const entryId = '/@fs/project/src/components/Search.tsx';
			const modules = new Map([
				[entryId, moduleInfo(entryId, { code: 'export default () => null;' })],
			]);
			plugin.generateBundle.call({
				environment: { name: 'client' },
				getModuleIds: () => modules.keys(),
				getModuleInfo: (id: string) => modules.get(id) ?? null,
				getFileName: (handle: string) => {
					throw new Error(`Unknown reference id ${handle}`);
				},
			});
			const client = internals.incrementalDiagnosticsClient;
			assert.ok(client, 'client diagnostics should be recorded');
			assert.deepEqual(client.routeRoots[COMPONENT], [entryId]);
			assert.ok(client.modules[entryId], 'client module should be fingerprinted');
			// The final aggregate hash is folded back into the prerender diagnostics
			// so the next build can trust them for this route.
			assert.notEqual(
				internals.incrementalDiagnosticsPrerender.routeDependencyHashes[COMPONENT],
				'base',
			);
		});
	});
});
