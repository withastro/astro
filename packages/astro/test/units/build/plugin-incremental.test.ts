import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
	{ code = '', importedIds = [] as string[], importers = [] as string[] } = {},
) {
	return {
		id,
		code,
		importedIds,
		importers,
		dynamicallyImportedIds: [],
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

function contentEntryHashes(
	modules: Map<string, ReturnType<typeof moduleInfo>>,
	onGetModuleInfo?: () => void,
) {
	const internals = { pagesByViteID: new Map() } as any;
	const plugin = pluginIncremental(internals, ROOT) as any;
	plugin.generateBundle.call({
		environment: { name: 'prerender' },
		getModuleIds: () => modules.keys(),
		getModuleInfo: (id: string) => {
			onGetModuleInfo?.();
			return modules.get(id) ?? null;
		},
		getFileName: () => {
			throw new Error('Unexpected asset reference');
		},
	});
	return internals.contentEntryRenderHashes as Map<string, string>;
}

function pageDependencyHashes(
	modules: Map<string, ReturnType<typeof moduleInfo>>,
	pagesByViteID: Map<string, { component: string }>,
	onGetModuleInfo?: () => void,
) {
	const internals = { pagesByViteID } as any;
	const plugin = pluginIncremental(internals, ROOT) as any;
	plugin.generateBundle.call({
		environment: { name: 'prerender' },
		getModuleIds: () => modules.keys(),
		getModuleInfo: (id: string) => {
			onGetModuleInfo?.();
			return modules.get(id) ?? null;
		},
		getFileName: () => {
			throw new Error('Unexpected asset reference');
		},
	});
	return internals.pageDependencyHashes as Map<string, string>;
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

		it('hashes a shared graph once for many pages', () => {
			const modules = new Map<string, ReturnType<typeof moduleInfo>>();
			const pagesByViteID = new Map<string, { component: string }>();
			const sharedCount = 100;
			const pageCount = 100;
			for (let index = 0; index < sharedCount; index++) {
				const id = `/project/src/components/shared-${index}.ts`;
				const importedIds =
					index + 1 < sharedCount ? [`/project/src/components/shared-${index + 1}.ts`] : [];
				modules.set(id, moduleInfo(id, { code: String(index), importedIds }));
			}
			for (let index = 0; index < pageCount; index++) {
				const id = `/project/src/pages/page-${index}.astro`;
				modules.set(
					id,
					moduleInfo(id, {
						importedIds: ['/project/src/components/shared-0.ts'],
						importers: [VIRTUAL_PAGE_RESOLVED_MODULE_ID],
					}),
				);
				pagesByViteID.set(id, { component: `src/pages/page-${index}.astro` });
			}

			let getModuleInfoCalls = 0;
			const hashes = pageDependencyHashes(modules, pagesByViteID, () => getModuleInfoCalls++);
			assert.equal(hashes.size, pageCount);
			assert.ok(getModuleInfoCalls <= modules.size * 4, `made ${getModuleInfoCalls} graph lookups`);
		});
	});

	describe('content entry hash', () => {
		it('invalidates every entry that imports a changed shared dependency', () => {
			const shared = '/project/src/components/shared.astro';
			const firstModules = new Map([
				[
					'/project/src/content/one.mdx',
					moduleInfo('/project/src/content/one.mdx', { importedIds: [shared] }),
				],
				[
					'/project/src/content/one.mdx?astroPropagatedAssets',
					moduleInfo('/project/src/content/one.mdx?astroPropagatedAssets'),
				],
				[
					'/project/src/content/two.mdx',
					moduleInfo('/project/src/content/two.mdx', { importedIds: [shared] }),
				],
				[
					'/project/src/content/two.mdx?astroPropagatedAssets',
					moduleInfo('/project/src/content/two.mdx?astroPropagatedAssets'),
				],
				[shared, moduleInfo(shared, { code: 'first' })],
			]);
			const secondModules = new Map(firstModules);
			secondModules.set(shared, moduleInfo(shared, { code: 'second' }));

			const first = contentEntryHashes(firstModules);
			const second = contentEntryHashes(secondModules);
			assert.notEqual(first.get('src/content/one.mdx'), second.get('src/content/one.mdx'));
			assert.notEqual(first.get('src/content/two.mdx'), second.get('src/content/two.mdx'));
		});

		it('handles cycles deterministically', () => {
			const entry = '/project/src/content/one.mdx';
			const a = '/project/src/components/a.ts';
			const b = '/project/src/components/b.ts';
			const modules = new Map([
				[entry, moduleInfo(entry, { importedIds: [a] })],
				[`${entry}?astroPropagatedAssets`, moduleInfo(`${entry}?astroPropagatedAssets`)],
				[a, moduleInfo(a, { code: 'a', importedIds: [b] })],
				[b, moduleInfo(b, { code: 'b', importedIds: [a] })],
			]);

			const first = contentEntryHashes(modules).get('src/content/one.mdx');
			const second = contentEntryHashes(new Map([...modules].reverse())).get('src/content/one.mdx');
			assert.equal(first, second);
		});

		it('hashes a shared graph once for many content entries', () => {
			const modules = new Map<string, ReturnType<typeof moduleInfo>>();
			const sharedCount = 100;
			const entryCount = 100;
			for (let index = 0; index < sharedCount; index++) {
				const id = `/project/src/components/shared-${index}.ts`;
				const importedIds =
					index + 1 < sharedCount ? [`/project/src/components/shared-${index + 1}.ts`] : [];
				modules.set(id, moduleInfo(id, { code: String(index), importedIds }));
			}
			for (let index = 0; index < entryCount; index++) {
				const id = `/project/src/content/entry-${index}.mdx`;
				modules.set(id, moduleInfo(id, { importedIds: ['/project/src/components/shared-0.ts'] }));
				modules.set(`${id}?astroPropagatedAssets`, moduleInfo(`${id}?astroPropagatedAssets`));
			}

			let getModuleInfoCalls = 0;
			const hashes = contentEntryHashes(modules, () => getModuleInfoCalls++);
			assert.equal(hashes.size, entryCount);
			assert.ok(getModuleInfoCalls <= modules.size * 3, `made ${getModuleInfoCalls} graph lookups`);
		});
	});
});
