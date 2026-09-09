import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, describe, it } from 'node:test';
import {
	IncrementalBuildCache,
	type DiagnosticGraph,
	type IncrementalCacheLoadReason,
	type IncrementalCacheLoadResult,
	type IncrementalDiagnosticsFile,
	type IncrementalManifest,
	type IncrementalPathMissReason,
} from '../../../dist/core/build/incremental.js';
import type { AstroSettings } from '../../../dist/types/astro.js';

const ROUTE = 'src/pages/[slug].astro';
const HASH = 'deadbeef';
const ROOT = new URL('file:///project/');

function settings(cacheDir: URL): AstroSettings {
	return { config: { cacheDir, root: ROOT } } as unknown as AstroSettings;
}

function tmpCacheDir(): { dir: URL; cleanup: () => void } {
	const dir = mkdtempSync(join(tmpdir(), 'astro-incremental-'));
	const cacheDir = new URL(pathToFileURL(dir).href + '/');
	return {
		dir: cacheDir,
		cleanup: () => rmSync(dir, { recursive: true, force: true }),
	};
}

function previousManifest(
	paths: Record<
		string,
		{ cacheKey: string; outputFile: string; contentHashes?: Record<string, string> }
	>,
	{ dependencyHash = HASH, route = ROUTE, keyDigest = 'key' } = {},
): IncrementalManifest {
	return {
		version: 1,
		configHash: 'cfg',
		lockfileHash: 'lock',
		keyDigest,
		routes: { [route]: { dependencyHash, paths } },
	};
}

function loadedCache(
	previous: IncrementalManifest | null,
	{
		reasons = previous
			? (['loaded'] as IncrementalCacheLoadReason[])
			: (['missing'] as IncrementalCacheLoadReason[]),
		contentHashes = new Map<string, string>(),
		currentDiagnostics = null,
		settingsOverride,
		islandKeyChanged = false,
	}: {
		reasons?: IncrementalCacheLoadReason[];
		contentHashes?: Map<string, string>;
		currentDiagnostics?: IncrementalDiagnosticsFile | null;
		settingsOverride?: AstroSettings;
		islandKeyChanged?: boolean;
	} = {},
): IncrementalBuildCache {
	const loadResult: IncrementalCacheLoadResult = {
		previous,
		reasons,
		islandKeyChanged,
	};
	return new IncrementalBuildCache(
		'cfg',
		'lock',
		'key',
		contentHashes,
		loadResult,
		currentDiagnostics,
		settingsOverride,
	);
}

function graph(
	modules: Record<
		string,
		{ fingerprint: string; importedIds?: string[]; dynamicallyImportedIds?: string[] }
	>,
	opts: {
		routeRoots?: Record<string, string[]>;
		contentRoots?: Record<string, string[]>;
		routeDependencyHashes?: Record<string, string>;
	} = {},
): DiagnosticGraph {
	return {
		modules: Object.fromEntries(
			Object.entries(modules).map(([id, module]) => [
				id,
				{
					fingerprint: module.fingerprint,
					importedIds: [...(module.importedIds ?? [])].sort(),
					dynamicallyImportedIds: [...(module.dynamicallyImportedIds ?? [])].sort(),
				},
			]),
		),
		routeRoots: opts.routeRoots ?? {},
		contentRoots: opts.contentRoots ?? {},
		routeDependencyHashes: opts.routeDependencyHashes ?? {},
	};
}

const emptyGraph = () => graph({});

function missReasons(
	cache: IncrementalBuildCache,
	pathname: string,
	cacheKey?: string,
	hasServerIsland = false,
): IncrementalPathMissReason[] {
	const decision = cache.checkPath(ROUTE, pathname, HASH, cacheKey, hasServerIsland);
	assert.equal(decision.reusable, false);
	return decision.reusable ? [] : decision.reasons;
}

describe('IncrementalBuildCache', () => {
	describe('load result classification', () => {
		const temp = tmpCacheDir();
		after(() => temp.cleanup());

		function load(force = false) {
			return IncrementalBuildCache.load(
				settings(temp.dir),
				'cfg',
				'lock',
				'key',
				new Map(),
				null,
				force,
			).loadResult;
		}

		it('reports a missing manifest (ENOENT)', () => {
			assert.deepEqual(load(), { previous: null, reasons: ['missing'], islandKeyChanged: false });
		});

		it('reports malformed JSON as an invalid manifest', () => {
			writeFileSync(new URL('incremental-build.json', temp.dir), 'not json {');
			assert.deepEqual(load(), {
				previous: null,
				reasons: ['invalid-manifest'],
				islandKeyChanged: false,
			});
		});

		it('reports a manifest with an invalid top-level shape as invalid', () => {
			writeFileSync(new URL('incremental-build.json', temp.dir), JSON.stringify({ version: 1 }));
			assert.deepEqual(load(), {
				previous: null,
				reasons: ['invalid-manifest'],
				islandKeyChanged: false,
			});
		});

		it('reports an unreadable manifest with its error code', () => {
			// A directory at the manifest path makes readFileSync throw (EISDIR).
			rmSync(new URL('incremental-build.json', temp.dir), { force: true });
			mkdirSync(new URL('incremental-build.json', temp.dir));
			const result = load();
			assert.deepEqual(result.reasons, ['unreadable']);
			assert.equal(result.errorCode, 'EISDIR');
			rmSync(new URL('incremental-build.json', temp.dir), { recursive: true, force: true });
		});

		it('reports a cache-format version mismatch', () => {
			const manifest = previousManifest({});
			manifest.version = 0;
			writeFileSync(new URL('incremental-build.json', temp.dir), JSON.stringify(manifest));
			const result = load();
			assert.deepEqual(result.reasons, ['version-changed']);
			assert.equal(result.previousVersion, 0);
		});

		it('reports a config hash mismatch', () => {
			writeFileSync(
				new URL('incremental-build.json', temp.dir),
				JSON.stringify(previousManifest({})),
			);
			const result = IncrementalBuildCache.load(
				settings(temp.dir),
				'changed-config',
				'lock',
				'key',
			).loadResult;
			assert.deepEqual(result.reasons, ['config-changed']);
		});

		it('reports a lockfile hash mismatch', () => {
			writeFileSync(
				new URL('incremental-build.json', temp.dir),
				JSON.stringify(previousManifest({})),
			);
			const result = IncrementalBuildCache.load(
				settings(temp.dir),
				'cfg',
				'changed-lockfile',
				'key',
			).loadResult;
			assert.deepEqual(result.reasons, ['lockfile-changed']);
		});

		it('reports simultaneous config and lockfile mismatches in stable order', () => {
			writeFileSync(
				new URL('incremental-build.json', temp.dir),
				JSON.stringify(previousManifest({})),
			);
			const result = IncrementalBuildCache.load(
				settings(temp.dir),
				'changed-config',
				'changed-lockfile',
				'key',
			).loadResult;
			assert.deepEqual(result.reasons, ['config-changed', 'lockfile-changed']);
		});

		it('force takes precedence over a valid manifest', () => {
			writeFileSync(
				new URL('incremental-build.json', temp.dir),
				JSON.stringify(previousManifest({})),
			);
			const result = load(true);
			assert.deepEqual(result.reasons, ['forced']);
			assert.equal(result.previous, null);
		});

		it('loads a valid manifest and reports a server-island key mismatch separately', () => {
			writeFileSync(
				new URL('incremental-build.json', temp.dir),
				JSON.stringify(previousManifest({}, { keyDigest: 'old-key' })),
			);
			const result = load();
			assert.deepEqual(result.reasons, ['loaded']);
			assert.notEqual(result.previous, null);
			assert.equal(result.islandKeyChanged, true);
		});

		it('loads a valid manifest with a matching island key', () => {
			writeFileSync(
				new URL('incremental-build.json', temp.dir),
				JSON.stringify(previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } })),
			);
			const result = load();
			assert.deepEqual(result.reasons, ['loaded']);
			assert.equal(result.islandKeyChanged, false);
			assert.equal(result.previous?.routes[ROUTE]?.paths['/a']?.cacheKey, 'k1');
		});
	});

	describe('checkPath', () => {
		it('reports no cacheKey', () => {
			const cache = loadedCache(null);
			assert.deepEqual(missReasons(cache, '/a'), [{ type: 'no-cache-key' }]);
		});

		it('reports a forced build', () => {
			const cache = loadedCache(null, { reasons: ['forced'] });
			assert.deepEqual(missReasons(cache, '/a', 'k1'), [
				{ type: 'global-cache', reasons: ['forced'] },
			]);
		});

		it('reports a missing cache', () => {
			const cache = loadedCache(null);
			assert.deepEqual(missReasons(cache, '/a', 'k1'), [
				{ type: 'global-cache', reasons: ['missing'] },
			]);
		});

		it('reports an invalid manifest', () => {
			const cache = loadedCache(null, { reasons: ['invalid-manifest'] });
			assert.deepEqual(missReasons(cache, '/a', 'k1'), [
				{ type: 'global-cache', reasons: ['invalid-manifest'] },
			]);
		});

		it('reports simultaneous global mismatches', () => {
			const cache = loadedCache(null, { reasons: ['config-changed', 'lockfile-changed'] });
			assert.deepEqual(missReasons(cache, '/a', 'k1'), [
				{ type: 'global-cache', reasons: ['config-changed', 'lockfile-changed'] },
			]);
		});

		it('reports a new route', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = loadedCache(previous);
			const decision = cache.checkPath('src/pages/other.astro', '/a', HASH, 'k1');
			assert.deepEqual(decision, { reusable: false, reasons: [{ type: 'new-route' }] });
		});

		it('reports changed module dependencies', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = loadedCache(previous);
			const decision = cache.checkPath(ROUTE, '/a', 'changed', 'k1');
			assert.equal(decision.reusable, false);
			assert.ok(
				decision.reusable === false && decision.reasons[0].type === 'route-dependencies-changed',
			);
		});

		it('reports a new path', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = loadedCache(previous);
			assert.deepEqual(missReasons(cache, '/missing', 'k1'), [{ type: 'new-path' }]);
		});

		it('reports a changed cacheKey', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = loadedCache(previous);
			assert.deepEqual(missReasons(cache, '/a', 'k2'), [{ type: 'cache-key-changed' }]);
		});

		it('reports a single changed content entry', () => {
			const previous = previousManifest({
				'/a': {
					cacheKey: 'k1',
					outputFile: 'a/index.html',
					contentHashes: { 'src/content/docs/a.mdx': 'h1' },
				},
			});
			const cache = loadedCache(previous, {
				contentHashes: new Map([['src/content/docs/a.mdx', 'h2']]),
			});
			const reasons = missReasons(cache, '/a', 'k1');
			assert.equal(reasons.length, 1);
			assert.equal(reasons[0].type, 'content-dependencies-changed');
			if (reasons[0].type === 'content-dependencies-changed') {
				assert.deepEqual(reasons[0].entries, ['src/content/docs/a.mdx']);
			}
		});

		it('reports multiple changed content entries', () => {
			const previous = previousManifest({
				'/a': {
					cacheKey: 'k1',
					outputFile: 'a/index.html',
					contentHashes: { 'src/content/docs/a.mdx': 'h1', 'src/content/docs/b.mdx': 'h2' },
				},
			});
			const cache = loadedCache(previous, {
				contentHashes: new Map([
					['src/content/docs/a.mdx', 'h2'],
					['src/content/docs/b.mdx', 'h3'],
				]),
			});
			const reasons = missReasons(cache, '/a', 'k1');
			assert.equal(reasons.length, 1);
			if (reasons[0].type === 'content-dependencies-changed') {
				assert.deepEqual(reasons[0].entries, ['src/content/docs/a.mdx', 'src/content/docs/b.mdx']);
			}
		});

		it('reports every independent reason in stable order', () => {
			const previous = previousManifest(
				{
					'/a': {
						cacheKey: 'k1',
						outputFile: 'a/index.html',
						contentHashes: { 'src/content/docs/a.mdx': 'h1' },
					},
				},
				{ keyDigest: 'old-key' },
			);
			const cache = loadedCache(previous, {
				contentHashes: new Map([['src/content/docs/a.mdx', 'h2']]),
				islandKeyChanged: true,
			});
			const decision = cache.checkPath(ROUTE, '/a', 'changed', 'k2', true);
			assert.equal(decision.reusable, false);
			if (decision.reusable) return;
			assert.deepEqual(
				decision.reasons.map((reason) => reason.type),
				[
					'island-key-changed',
					'route-dependencies-changed',
					'cache-key-changed',
					'content-dependencies-changed',
				],
			);
		});

		it('skips a server-island page when the key digest is unchanged', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = loadedCache(previous);
			assert.deepEqual(cache.checkPath(ROUTE, '/a', HASH, 'k1', true), { reusable: true });
		});

		it('does not skip a server-island page when the key digest changed', () => {
			const previous = previousManifest(
				{ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } },
				{ keyDigest: 'old-key' },
			);
			const cache = loadedCache(previous, { islandKeyChanged: true });
			assert.deepEqual(missReasons(cache, '/a', 'k1', true), [{ type: 'island-key-changed' }]);
			// A page without an island is unaffected by the key change.
			assert.deepEqual(cache.checkPath(ROUTE, '/a', HASH, 'k1', false), { reusable: true });
		});

		it('is reusable when every input matches', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = loadedCache(previous);
			assert.deepEqual(cache.checkPath(ROUTE, '/a', HASH, 'k1'), { reusable: true });
		});
	});

	describe('dependency explanations', () => {
		function diagnosticsCache(
			previousGraph: DiagnosticGraph,
			currentGraph: DiagnosticGraph,
			{
				sidecar = previousGraph,
				previousManifestHash = HASH,
			}: { sidecar?: DiagnosticGraph; previousManifestHash?: string } = {},
		): { cache: IncrementalBuildCache; temp: { cleanup: () => void } } {
			const temp = tmpCacheDir();
			const manifest = previousManifest(
				{ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } },
				{ dependencyHash: previousManifestHash },
			);
			writeFileSync(new URL('incremental-build.json', temp.dir), JSON.stringify(manifest));
			writeFileSync(
				new URL('incremental-build-diagnostics.json', temp.dir),
				JSON.stringify({ version: 1, prerender: sidecar, client: emptyGraph() }),
			);
			const cache = loadedCache(manifest, {
				currentDiagnostics: { version: 1, prerender: currentGraph, client: emptyGraph() },
				settingsOverride: settings(temp.dir),
			});
			return { cache, temp };
		}

		const PAGE = '/project/src/pages/page.astro';
		const SIDEBAR = '/project/src/components/Sidebar.astro';
		const SIDEBAR_DATA = '/project/src/data/sidebar_data.ts';
		const OTHER = '/project/src/components/Other.astro';

		it('explains a changed leaf with a deterministic chain', () => {
			const previous = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
					[SIDEBAR_DATA]: { fingerprint: 'v1' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] }, routeDependencyHashes: { [ROUTE]: HASH } },
			);
			const current = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
					[SIDEBAR_DATA]: { fingerprint: 'v2' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] } },
			);
			const { cache, temp } = diagnosticsCache(previous, current);
			const decision = cache.checkPath(ROUTE, '/a', 'changed-hash', 'k1');
			assert.equal(decision.reusable, false);
			if (decision.reusable) return;
			const reason = decision.reasons.find((r) => r.type === 'route-dependencies-changed');
			assert.ok(reason && reason.type === 'route-dependencies-changed' && reason.changes);
			assert.deepEqual(reason.changes, [
				{
					status: 'changed',
					chain: ['src/components/Sidebar.astro', 'src/data/sidebar_data.ts'],
				},
			]);
			temp.cleanup();
		});

		it('reports added and removed leaves', () => {
			const previous = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
					[SIDEBAR_DATA]: { fingerprint: 'v1' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] }, routeDependencyHashes: { [ROUTE]: HASH } },
			);
			const current = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [OTHER] },
					[OTHER]: { fingerprint: 'other' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] } },
			);
			const { cache, temp } = diagnosticsCache(previous, current);
			const explanation = cache.explainRoute(ROUTE);
			assert.ok(explanation && 'changes' in explanation);
			if (explanation && 'changes' in explanation) {
				assert.deepEqual(
					explanation.changes.map((change) => [change.status, change.chain.at(-1)]),
					[
						['added', 'src/components/Other.astro'],
						['removed', 'src/data/sidebar_data.ts'],
					],
				);
			}
			temp.cleanup();
		});

		it('finds the shortest chain when a module has multiple importers', () => {
			const previous = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR, OTHER] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
					[OTHER]: { fingerprint: 'other', importedIds: [SIDEBAR_DATA] },
					[SIDEBAR_DATA]: { fingerprint: 'v1' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] }, routeDependencyHashes: { [ROUTE]: HASH } },
			);
			const current = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR, OTHER] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
					[OTHER]: { fingerprint: 'other', importedIds: [SIDEBAR_DATA] },
					[SIDEBAR_DATA]: { fingerprint: 'v2' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] } },
			);
			const { cache, temp } = diagnosticsCache(previous, current);
			const explanation = cache.explainRoute(ROUTE);
			assert.ok(explanation && 'changes' in explanation);
			if (explanation && 'changes' in explanation) {
				assert.equal(explanation.changes.length, 1);
				// SIDEBAR_DATA is reachable directly from OTHER, so the chain is
				// PAGE → OTHER → SIDEBAR_DATA and skips the longer SIDEBAR path.
				assert.deepEqual(explanation.changes[0].chain, [
					'src/components/Other.astro',
					'src/data/sidebar_data.ts',
				]);
			}
			temp.cleanup();
		});

		it('terminates on cycles and explains each changed leaf once', () => {
			const A = '/project/src/components/A.astro';
			const B = '/project/src/components/B.astro';
			const previous = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [A] },
					[A]: { fingerprint: 'a1', importedIds: [B] },
					[B]: { fingerprint: 'b1', importedIds: [A] },
				},
				{ routeRoots: { [ROUTE]: [PAGE] }, routeDependencyHashes: { [ROUTE]: HASH } },
			);
			const current = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [A] },
					[A]: { fingerprint: 'a1', importedIds: [B] },
					[B]: { fingerprint: 'b2', importedIds: [A] },
				},
				{ routeRoots: { [ROUTE]: [PAGE] } },
			);
			const { cache, temp } = diagnosticsCache(previous, current);
			const explanation = cache.explainRoute(ROUTE);
			assert.ok(explanation && 'changes' in explanation);
			if (explanation && 'changes' in explanation) {
				assert.equal(explanation.changes.length, 1);
				assert.equal(explanation.changes[0].chain.at(-1), 'src/components/B.astro');
			}
			temp.cleanup();
		});

		it('explains a content entry change through the rendered-content boundary', () => {
			const ENTRY = '/project/src/content/docs/a.mdx';
			const CALLOUT = '/project/src/components/Callout.astro';
			const previous = graph(
				{
					[ENTRY]: { fingerprint: 'entry1', importedIds: [CALLOUT] },
					[CALLOUT]: { fingerprint: 'callout1' },
				},
				{
					contentRoots: { 'src/content/docs/a.mdx': [ENTRY] },
					routeDependencyHashes: { [ROUTE]: HASH },
				},
			);
			const current = graph(
				{
					[ENTRY]: { fingerprint: 'entry1', importedIds: [CALLOUT] },
					[CALLOUT]: { fingerprint: 'callout2' },
				},
				{ contentRoots: { 'src/content/docs/a.mdx': [ENTRY] } },
			);
			const { cache, temp } = diagnosticsCache(previous, current);
			const explanation = cache.explainContent('src/content/docs/a.mdx');
			assert.ok(explanation && 'changes' in explanation);
			if (explanation && 'changes' in explanation) {
				assert.deepEqual(explanation.changes, [
					{
						status: 'changed',
						chain: ['rendered content: src/content/docs/a.mdx', 'src/components/Callout.astro'],
					},
				]);
			}
			temp.cleanup();
		});

		it('ignores a sidecar that does not match the manifest route hash', () => {
			const current = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
					[SIDEBAR_DATA]: { fingerprint: 'v2' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] } },
			);
			const staleSidecar = graph(
				{
					[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR] },
					[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
					[SIDEBAR_DATA]: { fingerprint: 'v1' },
				},
				{ routeRoots: { [ROUTE]: [PAGE] }, routeDependencyHashes: { [ROUTE]: 'stale-hash' } },
			);
			const { cache, temp } = diagnosticsCache(staleSidecar, current, {
				sidecar: staleSidecar,
				previousManifestHash: HASH,
			});
			const decision = cache.checkPath(ROUTE, '/a', 'changed-hash', 'k1');
			assert.equal(decision.reusable, false);
			if (decision.reusable) return;
			const reason = decision.reasons.find((r) => r.type === 'route-dependencies-changed');
			assert.ok(reason && reason.type === 'route-dependencies-changed');
			assert.equal(reason.changes, undefined);
			assert.equal(reason.diagnosticsUnavailable, 'unavailable');
			temp.cleanup();
		});

		it('reports missing-sidecar when no previous diagnostics exist', () => {
			const temp = tmpCacheDir();
			const manifest = previousManifest({
				'/a': { cacheKey: 'k1', outputFile: 'a/index.html' },
			});
			writeFileSync(new URL('incremental-build.json', temp.dir), JSON.stringify(manifest));
			const cache = loadedCache(manifest, {
				currentDiagnostics: {
					version: 1,
					prerender: graph(
						{
							[PAGE]: { fingerprint: 'page', importedIds: [SIDEBAR] },
							[SIDEBAR]: { fingerprint: 'sidebar', importedIds: [SIDEBAR_DATA] },
							[SIDEBAR_DATA]: { fingerprint: 'v2' },
						},
						{ routeRoots: { [ROUTE]: [PAGE] } },
					),
					client: emptyGraph(),
				},
				settingsOverride: settings(temp.dir),
			});
			const decision = cache.checkPath(ROUTE, '/a', 'changed-hash', 'k1');
			assert.equal(decision.reusable, false);
			if (decision.reusable) return;
			const reason = decision.reasons.find((r) => r.type === 'route-dependencies-changed');
			assert.ok(reason && reason.type === 'route-dependencies-changed');
			assert.equal(reason.changes, undefined);
			assert.equal(reason.diagnosticsUnavailable, 'missing-sidecar');
			temp.cleanup();
		});
	});

	describe('findOrphanedFiles', () => {
		it('is empty when there is no previous build', () => {
			const cache = loadedCache(null);
			cache.record(ROUTE, HASH, '/a', 'k1', 'a/index.html');
			assert.deepEqual(cache.findOrphanedFiles(), []);
		});

		it('does not orphan a path re-recorded in this build', () => {
			const previous = previousManifest({ '/a': { cacheKey: 'k1', outputFile: 'a/index.html' } });
			const cache = loadedCache(previous);
			cache.record(ROUTE, HASH, '/a', 'k1', 'a/index.html');
			assert.deepEqual(cache.findOrphanedFiles(), []);
		});

		it('orphans a previous path that is no longer produced', () => {
			const previous = previousManifest({
				'/a': { cacheKey: 'k1', outputFile: 'a/index.html' },
				'/b': { cacheKey: 'k2', outputFile: 'b/index.html' },
			});
			const cache = loadedCache(previous);
			cache.record(ROUTE, HASH, '/a', 'k1', 'a/index.html');
			assert.deepEqual(cache.findOrphanedFiles(), ['b/index.html']);
		});
	});
});
