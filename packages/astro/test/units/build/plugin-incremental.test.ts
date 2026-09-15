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
});
