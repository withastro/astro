import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
	foldStylesheetDependencies,
	pluginIncremental,
} from '../../../dist/core/build/plugins/plugin-incremental.js';
import { VIRTUAL_PAGE_RESOLVED_MODULE_ID } from '../../../dist/vite-plugin-pages/const.js';

// `fileURLToPath` rejects a driveless file URL on Windows.
const PROJECT_DIR = process.platform === 'win32' ? 'C:/project/' : '/project/';
const ROOT = pathToFileURL(PROJECT_DIR);
const PAGE_ID = `${PROJECT_DIR}src/pages/[slug].astro`;
const COMPONENT = 'src/pages/[slug].astro';
const RED = `${PROJECT_DIR}src/assets/red.png`;
const BLUE = `${PROJECT_DIR}src/assets/blue.png`;
const VIDEO = `${PROJECT_DIR}src/assets/clip.mp4`;

const HANDLE_ONE = 'VRAku6fjghkApIISiBWPzg';
const HANDLE_TWO = 'WPGYjwIlzWVNM1bYhOc83w';

const BASE_HASH = 'base-hash';

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

	describe('stylesheet dependencies (#17974)', () => {
		const EXTERNAL = { type: 'external', src: '_astro/main.aaaa.css' };
		const EXTERNAL_RENAMED = { type: 'external', src: '_astro/main.bbbb.css' };
		const INLINE_RED = { type: 'inline', content: 'body{color:red}' };
		const INLINE_BLUE = { type: 'inline', content: 'body{color:blue}' };

		function page(component: string, styles: any[], { route = '/x', prerender = true } = {}) {
			return {
				key: `${route}\u0000${component}`,
				component,
				moduleSpecifier: component,
				route: { route, component, prerender },
				styles,
			};
		}

		function fold(pages: any[], { base = BASE_HASH, propagated = new Map() } = {}) {
			const internals = {
				pagesByKeys: new Map(pages.map((p) => [p.key, p])),
				pageDependencyHashes: new Map([[COMPONENT, base]]),
				contentEntryRenderHashes: new Map(),
				propagatedStylesMap: propagated,
			} as any;
			foldStylesheetDependencies(internals, ROOT);
			return internals;
		}

		function pageHash(styles: any[]) {
			return fold([page(COMPONENT, styles)]).pageDependencyHashes.get(COMPONENT);
		}

		it('changes when an external stylesheet resolves to a different file name', () => {
			assert.notEqual(
				pageHash([{ depth: 0, order: 0, sheet: EXTERNAL }]),
				pageHash([{ depth: 0, order: 0, sheet: EXTERNAL_RENAMED }]),
			);
		});

		it('changes when inline stylesheet content changes', () => {
			assert.notEqual(
				pageHash([{ depth: 0, order: 0, sheet: INLINE_RED }]),
				pageHash([{ depth: 0, order: 0, sheet: INLINE_BLUE }]),
			);
		});

		it('is stable when the same sheets are appended in a different order', () => {
			const a = { depth: -1, order: -1, sheet: EXTERNAL };
			const b = { depth: -1, order: -1, sheet: INLINE_RED };
			assert.equal(pageHash([a, b]), pageHash([b, a]));
		});

		it('changes when a sheet moves to a different depth or order', () => {
			assert.notEqual(
				pageHash([{ depth: 0, order: 0, sheet: EXTERNAL }]),
				pageHash([{ depth: 1, order: 0, sheet: EXTERNAL }]),
			);
			assert.notEqual(
				pageHash([{ depth: 0, order: 0, sheet: EXTERNAL }]),
				pageHash([{ depth: 0, order: 1, sheet: EXTERNAL }]),
			);
		});

		it('leaves the hash untouched for a component with no stylesheets', () => {
			assert.equal(pageHash([]), BASE_HASH);
		});

		it('folds in every route that shares a component', () => {
			const shared = [page(COMPONENT, [{ depth: 0, order: 0, sheet: EXTERNAL }], { route: '/x' })];
			const first = fold([
				...shared,
				page(COMPONENT, [{ depth: 0, order: 0, sheet: INLINE_RED }], { route: '/y' }),
			]);
			const second = fold([
				...shared,
				page(COMPONENT, [{ depth: 0, order: 0, sheet: INLINE_BLUE }], { route: '/y' }),
			]);
			assert.notEqual(
				first.pageDependencyHashes.get(COMPONENT),
				second.pageDependencyHashes.get(COMPONENT),
			);
		});

		it('ignores routes that are not prerendered', () => {
			const internals = fold([
				page(COMPONENT, [{ depth: 0, order: 0, sheet: EXTERNAL }], { prerender: false }),
			]);
			assert.equal(internals.pageDependencyHashes.get(COMPONENT), BASE_HASH);
		});

		it('does not reorder the styles it hashes', () => {
			const styles = [
				{ depth: -1, order: -1, sheet: EXTERNAL },
				{ depth: -1, order: -1, sheet: INLINE_RED },
			];
			fold([page(COMPONENT, styles)]);
			assert.deepEqual(
				styles.map(({ sheet }) => sheet),
				[EXTERNAL, INLINE_RED],
			);
		});

		it('folds propagated styles into the content entry render hash', () => {
			const entryId = `${PROJECT_DIR}src/content/docs/a.mdx?astroPropagatedAssets`;
			const first = fold([], {
				propagated: new Map([[entryId, new Set([EXTERNAL])]]),
			}).contentEntryRenderHashes;
			const second = fold([], {
				propagated: new Map([[entryId, new Set([EXTERNAL_RENAMED])]]),
			}).contentEntryRenderHashes;

			const key = 'src/content/docs/a.mdx';
			assert.ok(first.get(key), 'entry should be keyed by its root-relative path');
			assert.notEqual(first.get(key), second.get(key));
		});
	});
});
