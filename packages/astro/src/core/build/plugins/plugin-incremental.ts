import crypto from 'node:crypto';
import type { Plugin as VitePlugin } from 'vite';
import { PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import { hasContentFlag } from '../../../content/utils.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import { removeQueryString } from '../../path.js';
import { rootRelativePath } from '../../viteUtils.js';
import { moduleIsTopLevelPage } from '../graph.js';
import { isContentDataIncrementalModule } from '../incremental-metadata.js';
import type { BuildInternals } from '../internal.js';
import { getPageDataByViteID } from '../internal.js';
import type { PageBuildData } from '../types.js';

interface HashableModuleInfo {
	code?: string | null;
	importedIds: readonly string[];
	dynamicallyImportedIds: readonly string[];
	meta?: Record<string, any>;
}

interface ModuleGraph {
	getModuleInfo(id: string): HashableModuleInfo | null;
}

/** Collect the sorted, transitive dependency ids of a module, following static and dynamic imports. */
function collectTransitiveDeps(graph: ModuleGraph, rootId: string): string[] {
	const deps = new Set<string>();
	const queue = [rootId];
	while (queue.length > 0) {
		const current = queue.pop()!;
		if (deps.has(current)) continue;

		const modInfo = graph.getModuleInfo(current);
		if (isContentDataIncrementalModule(modInfo)) continue;

		deps.add(current);
		if (!modInfo) continue;

		for (const dep of modInfo.importedIds) {
			if (!deps.has(dep)) queue.push(dep);
		}
		for (const dep of modInfo.dynamicallyImportedIds) {
			if (!deps.has(dep)) queue.push(dep);
		}
	}
	return [...deps].sort();
}

/**
 * Hash a sorted set of module ids together with each module's compiled output.
 * Hashing the transformed `code` from the bundle (rather than the source file on
 * disk) reflects what actually ships and covers virtual modules, which have no
 * file on disk but still carry generated code.
 */
function hashModules(graph: ModuleGraph, sortedIds: string[]): string {
	const hasher = crypto.createHash('sha256');
	for (const id of sortedIds) {
		hasher.update(id);
		hasher.update('\n');
		const code = graph.getModuleInfo(id)?.code;
		if (code != null) {
			hasher.update(code);
		}
		hasher.update('\n');
	}
	return hasher.digest('hex');
}

/**
 * Hash the transitive graph of each client entrypoint and accumulate the result
 * against every page that uses it, keyed by page component.
 */
function collectClientEntrypointHashes(
	graph: ModuleGraph,
	entrypointIds: Iterable<string>,
	pagesByEntrypoint: Map<string, Set<PageBuildData>>,
	hashesByComponent: Map<string, string[]>,
): void {
	for (const entrypointId of entrypointIds) {
		const pages = pagesByEntrypoint.get(entrypointId);
		if (!pages?.size) continue;

		const hash = hashModules(graph, collectTransitiveDeps(graph, entrypointId));
		for (const pageData of pages) {
			let list = hashesByComponent.get(pageData.component);
			if (!list) {
				list = [];
				hashesByComponent.set(pageData.component, list);
			}
			list.push(hash);
		}
	}
}

/**
 * `client:only` components and hoisted `<script>` tags are not part of the
 * prerender module graph, so the per-route hash cannot see their transitive
 * dependencies. Each is a client-build entrypoint whose bundle, and everything it
 * imports, is emitted with a content-hashed URL (or inlined) into the page markup,
 * so a change anywhere in that graph must re-render the page. During the client
 * build we hash each entrypoint's transitive graph and fold it into the dependency
 * hash of every route that uses it.
 */
function foldClientDependencies(graph: ModuleGraph, internals: BuildInternals): void {
	const baseHashes = internals.pageDependencyHashes;
	if (!baseHashes) return;

	const hashesByComponent = new Map<string, string[]>();
	collectClientEntrypointHashes(
		graph,
		internals.discoveredClientOnlyComponents.keys(),
		internals.pagesByClientOnly,
		hashesByComponent,
	);
	collectClientEntrypointHashes(
		graph,
		internals.discoveredScripts,
		internals.pagesByScriptId,
		hashesByComponent,
	);

	for (const [component, clientHashes] of hashesByComponent) {
		const hasher = crypto.createHash('sha256');
		hasher.update(baseHashes.get(component) ?? '');
		for (const hash of clientHashes.sort()) {
			hasher.update('\n');
			hasher.update(hash);
		}
		baseHashes.set(component, hasher.digest('hex'));
	}
}

/**
 * Hash the render graph of every content entry, keyed by the entry's
 * root-relative `filePath` (matching what the content runtime reports at render
 * time). A content entry's render module (compiled MD/MDX) and the components it
 * imports are reachable only through the `content-data`-pruned bridges, so the
 * per-route hash never sees them. Seeding the traversal at each render module
 * captures them per entry, giving precise invalidation without pulling one
 * entry's graph into another route's hash.
 */
function collectContentEntryHashes(
	graph: ModuleGraph & { getModuleIds(): IterableIterator<string> },
	root: URL,
): Map<string, string> {
	const entryHashes = new Map<string, string>();
	for (const id of graph.getModuleIds()) {
		if (!hasContentFlag(id, PROPAGATED_ASSET_FLAG)) continue;
		// e.g. "/abs/src/content/docs/one.mdx?astroPropagatedAssets" -> render module id.
		const renderModuleId = removeQueryString(id);
		const key = rootRelativePath(root, renderModuleId, false);
		const deps = collectTransitiveDeps(graph, renderModuleId);
		entryHashes.set(key, hashModules(graph, deps));
	}
	return entryHashes;
}

/**
 * Whether any module in a page's render graph uses a server island. The Astro
 * compiler records `server:defer` usage as `serverComponents` metadata on the
 * module that hosts it, so a page (or one of its layouts/components) that renders
 * an island is detectable from the graph it already walks for hashing.
 */
function pageContainsServerIsland(graph: ModuleGraph, ids: string[]): boolean {
	for (const id of ids) {
		const serverComponents = graph.getModuleInfo(id)?.meta?.astro?.serverComponents;
		if (serverComponents?.length) return true;
	}
	return false;
}

/**
 * Captures a dependency hash for each prerendered page route during the build.
 *
 * The base hash is derived during the prerender build from the sorted set of all
 * transitive module dependencies of the page, so any change to the page's
 * template, layouts, components, or utilities produces a different hash. During
 * the client build, the hash of each `client:only` component's and hoisted
 * `<script>`'s own module graph is folded in, since those never enter the
 * prerender graph. Content entries are hashed separately per entry, since their
 * render modules sit behind `content-data`-pruned bridges.
 */
export function pluginIncremental(internals: BuildInternals, root: URL): VitePlugin {
	return {
		name: '@astro/plugin-incremental',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client
			);
		},
		generateBundle() {
			if (this.environment?.name === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
				foldClientDependencies(this, internals);
				return;
			}

			const hashes = new Map<string, string>();
			const serverIslandComponents = new Set<string>();
			for (const id of this.getModuleIds()) {
				const info = this.getModuleInfo(id);
				if (!info) continue;
				if (!moduleIsTopLevelPage(info)) continue;

				const pageData = getPageDataByViteID(internals, info.id);
				if (!pageData) continue;

				const deps = collectTransitiveDeps(this, info.id);
				// Key by component path (e.g. "src/pages/blog/[slug].astro")
				hashes.set(pageData.component, hashModules(this, deps));
				if (pageContainsServerIsland(this, deps)) {
					serverIslandComponents.add(pageData.component);
				}
			}

			internals.pageDependencyHashes = hashes;
			internals.contentEntryRenderHashes = collectContentEntryHashes(this, root);
			internals.serverIslandPageComponents = serverIslandComponents;
		},
	};
}
