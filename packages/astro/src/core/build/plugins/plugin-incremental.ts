import crypto from 'node:crypto';
import nodeFs from 'node:fs';
import type { Plugin as VitePlugin } from 'vite';
import { FONTS_SERVER_ADDRESS_PLACEHOLDER } from '../../../assets/fonts/constants.js';
import { PROPAGATED_ASSET_FLAG } from '../../../content/consts.js';
import { hasContentFlag } from '../../../content/utils.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import { removeQueryString } from '../../path.js';
import { CSS_LANGS_RE, rootRelativePath } from '../../viteUtils.js';
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
	getFileName(referenceId: string): string;
}

interface HashableModuleGraph extends ModuleGraph {
	getModuleIds(): IterableIterator<string>;
}

interface TransitiveGraphCache {
	hashes: Map<string, string>;
	serverIslandModules: Set<string>;
}

/** Each placeholder pattern paired with the token that has to be present for it to match. */
const ASSET_PLACEHOLDERS = [
	{ token: '__ASTRO_ASSET_IMAGE__', pattern: /__ASTRO_ASSET_IMAGE__([\w$]+)__(?:_(.*?)__)?/g },
	{ token: '__VITE_ASSET__', pattern: /__VITE_ASSET__([\w$]+)__(?:\$_(.*?)__)?/g },
];

/**
 * Strip the fonts server address variable declaration from module code. The
 * fonts plugin assigns the ephemeral HTTP server's AddressInfo to a variable
 * named {@link FONTS_SERVER_ADDRESS_PLACEHOLDER}; the value includes an
 * OS-assigned port that differs between builds. Removing the declaration
 * (but keeping the stable variable reference) prevents the volatile port
 * from poisoning the dependency hash.
 */
const FONTS_ADDRESS_DECLARATION = new RegExp(
	`(?:const|let|var)\\s+${FONTS_SERVER_ADDRESS_PLACEHOLDER}\\s*=[^;]+;`,
);

/**
 * Replace the emit handles of imported assets with the file names they resolve
 * to. Handles are assigned by the bundler in the order modules finish
 * transforming, so two builds of the same sources can hand the same asset a
 * different handle, while the file name it resolves to is content-hashed and
 * stable. If a handle does not resolve to a file, the placeholder is left as
 * it is; the worst case is an unnecessary re-render, not a stale one.
 */
function resolveAssetPlaceholders(graph: ModuleGraph, code: string): string {
	let resolved = code;
	for (const { token, pattern } of ASSET_PLACEHOLDERS) {
		if (!resolved.includes(token)) continue;
		resolved = resolved.replace(pattern, (placeholder, handle, postfix = '') => {
			try {
				return graph.getFileName(handle) + postfix;
			} catch {
				return placeholder;
			}
		});
	}
	if (resolved.includes(FONTS_SERVER_ADDRESS_PLACEHOLDER)) {
		resolved = resolved.replace(FONTS_ADDRESS_DECLARATION, '');
	}
	return resolved;
}

/**
 * Hash a sorted set of module ids together with each module's compiled output.
 * Hashing the transformed `code` from the bundle (rather than the source file on
 * disk) reflects what actually ships and covers virtual modules, which have no
 * file on disk but still carry generated code. Emitted-asset placeholders in
 * that code are resolved to their file names first, since the handles
 * themselves are not stable between builds.
 *
 * CSS modules are a special case: Vite extracts their content during the
 * prerender build, leaving `code` as an empty string. For those modules, the
 * source file is read from disk so that CSS edits invalidate the hash.
 */
function hashModules(graph: ModuleGraph, sortedIds: string[]): string {
	const hasher = crypto.createHash('sha256');
	for (const id of sortedIds) {
		hasher.update(id);
		hasher.update('\n');
		const code = graph.getModuleInfo(id)?.code;
		if (code != null && code.length > 0) {
			hasher.update(resolveAssetPlaceholders(graph, code));
		} else if (CSS_LANGS_RE.test(id)) {
			// Vite extracts CSS into separate assets, so the module's `code` in the
			// prerender bundle is empty. Read the source file so that stylesheet
			// changes are reflected in the dependency hash (#17704).
			try {
				hasher.update(nodeFs.readFileSync(removeQueryString(id), 'utf-8'));
			} catch {
				// Virtual CSS or unreadable file — skip. The worst case is a
				// cache miss (re-render), never a stale hit.
			}
		}
		hasher.update('\n');
	}
	return hasher.digest('hex');
}

/**
 * Build a transitive hash for every module with one pass over the dependency graph.
 * Strongly connected components collapse cycles into a DAG, whose hashes can be
 * folded into every importer without walking shared dependencies again for each root.
 */
function createTransitiveGraphCache(graph: HashableModuleGraph): TransitiveGraphCache {
	const modules = new Map<string, HashableModuleInfo | null>();
	const dependencies = new Map<string, string[]>();
	const excludedModules = new Set<string>();
	const pending = [...graph.getModuleIds()];
	for (const id of pending) {
		if (modules.has(id)) continue;

		const info = graph.getModuleInfo(id);
		modules.set(id, info);
		if (isContentDataIncrementalModule(info)) {
			excludedModules.add(id);
			continue;
		}

		const importedIds = [...(info?.importedIds ?? []), ...(info?.dynamicallyImportedIds ?? [])];
		dependencies.set(id, importedIds);
		pending.push(...importedIds);
	}
	for (const id of excludedModules) modules.delete(id);
	for (const [id, importedIds] of dependencies) {
		dependencies.set(
			id,
			importedIds.filter((importedId) => !excludedModules.has(importedId)),
		);
	}

	const reverseDependencies = new Map<string, string[]>();
	for (const id of modules.keys()) reverseDependencies.set(id, []);
	for (const [id, importedIds] of dependencies) {
		for (const importedId of importedIds) reverseDependencies.get(importedId)?.push(id);
	}

	const visited = new Set<string>();
	const finishOrder: string[] = [];
	for (const rootId of modules.keys()) {
		if (visited.has(rootId)) continue;
		visited.add(rootId);
		const stack: Array<[string, number]> = [[rootId, 0]];
		while (stack.length > 0) {
			const frame = stack[stack.length - 1];
			const importedIds = dependencies.get(frame[0]) ?? [];
			if (frame[1] < importedIds.length) {
				const importedId = importedIds[frame[1]++];
				if (!visited.has(importedId)) {
					visited.add(importedId);
					stack.push([importedId, 0]);
				}
			} else {
				finishOrder.push(frame[0]);
				stack.pop();
			}
		}
	}

	const componentByModule = new Map<string, number>();
	const components: string[][] = [];
	for (const rootId of finishOrder.toReversed()) {
		if (componentByModule.has(rootId)) continue;
		const componentIndex = components.length;
		const component: string[] = [];
		const stack = [rootId];
		componentByModule.set(rootId, componentIndex);
		while (stack.length > 0) {
			const id = stack.pop()!;
			component.push(id);
			for (const importerId of reverseDependencies.get(id) ?? []) {
				if (!componentByModule.has(importerId)) {
					componentByModule.set(importerId, componentIndex);
					stack.push(importerId);
				}
			}
		}
		components.push(component.sort());
	}

	const componentDependencies = components.map(() => new Set<number>());
	const componentImporters = components.map(() => new Set<number>());
	for (const [id, importedIds] of dependencies) {
		const componentIndex = componentByModule.get(id)!;
		for (const importedId of importedIds) {
			const dependencyIndex = componentByModule.get(importedId)!;
			if (dependencyIndex === componentIndex) continue;
			componentDependencies[componentIndex].add(dependencyIndex);
			componentImporters[dependencyIndex].add(componentIndex);
		}
	}

	const componentHashes = new Map<number, string>();
	const componentHasServerIsland = new Map<number, boolean>();
	const unresolvedDependencies = componentDependencies.map((items) => items.size);
	const ready = unresolvedDependencies.flatMap((count, index) => (count === 0 ? [index] : []));
	for (const componentIndex of ready) {
		const hasher = crypto.createHash('sha256');
		hasher.update(hashModules(graph, components[componentIndex]));
		const dependencyHashes = [...componentDependencies[componentIndex]]
			.map((dependencyIndex) => componentHashes.get(dependencyIndex)!)
			.sort();
		for (const dependencyHash of dependencyHashes) {
			hasher.update('\n');
			hasher.update(dependencyHash);
		}
		componentHashes.set(componentIndex, hasher.digest('hex'));
		componentHasServerIsland.set(
			componentIndex,
			components[componentIndex].some(
				(id) => (modules.get(id)?.meta?.astro?.serverComponents?.length ?? 0) > 0,
			) ||
				[...componentDependencies[componentIndex]].some((dependencyIndex) =>
					componentHasServerIsland.get(dependencyIndex),
				),
		);

		for (const importerIndex of componentImporters[componentIndex]) {
			unresolvedDependencies[importerIndex]--;
			if (unresolvedDependencies[importerIndex] === 0) ready.push(importerIndex);
		}
	}

	return {
		hashes: new Map(
			[...componentByModule].map(([id, componentIndex]) => [
				id,
				componentHashes.get(componentIndex)!,
			]),
		),
		serverIslandModules: new Set(
			[...componentByModule]
				.filter(([, componentIndex]) => componentHasServerIsland.get(componentIndex))
				.map(([id]) => id),
		),
	};
}

/**
 * Hash the transitive graph of each client entrypoint and accumulate the result
 * against every page that uses it, keyed by page component.
 */
function collectClientEntrypointHashes(
	transitiveHashes: Map<string, string>,
	entrypointIds: Iterable<string>,
	pagesByEntrypoint: Map<string, Set<PageBuildData>>,
	hashesByComponent: Map<string, string[]>,
): void {
	for (const entrypointId of entrypointIds) {
		const pages = pagesByEntrypoint.get(entrypointId);
		if (!pages?.size) continue;

		const hash = transitiveHashes.get(entrypointId);
		if (!hash) continue;
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
function foldClientDependencies(graph: HashableModuleGraph, internals: BuildInternals): void {
	const baseHashes = internals.pageDependencyHashes;
	if (!baseHashes) return;

	const { hashes: transitiveHashes } = createTransitiveGraphCache(graph);
	const hashesByComponent = new Map<string, string[]>();
	collectClientEntrypointHashes(
		transitiveHashes,
		internals.discoveredClientOnlyComponents.keys(),
		internals.pagesByClientOnly,
		hashesByComponent,
	);
	collectClientEntrypointHashes(
		transitiveHashes,
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
	graph: HashableModuleGraph,
	root: URL,
	transitiveHashes: Map<string, string>,
): Map<string, string> {
	const entryHashes = new Map<string, string>();
	for (const id of graph.getModuleIds()) {
		if (!hasContentFlag(id, PROPAGATED_ASSET_FLAG)) continue;
		// e.g. "/abs/src/content/docs/one.mdx?astroPropagatedAssets" -> render module id.
		const renderModuleId = removeQueryString(id);
		const key = rootRelativePath(root, renderModuleId, false);
		const hash = transitiveHashes.get(renderModuleId);
		if (hash) entryHashes.set(key, hash);
	}
	return entryHashes;
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

			const transitiveGraph = createTransitiveGraphCache(this);
			const hashes = new Map<string, string>();
			const serverIslandComponents = new Set<string>();
			for (const id of this.getModuleIds()) {
				const info = this.getModuleInfo(id);
				if (!info) continue;
				if (!moduleIsTopLevelPage(info)) continue;

				const pageData = getPageDataByViteID(internals, info.id);
				if (!pageData) continue;

				const hash = transitiveGraph.hashes.get(info.id);
				if (!hash) continue;

				// Key by component path (e.g. "src/pages/blog/[slug].astro")
				hashes.set(pageData.component, hash);
				if (transitiveGraph.serverIslandModules.has(info.id)) {
					serverIslandComponents.add(pageData.component);
				}
			}

			internals.pageDependencyHashes = hashes;
			internals.contentEntryRenderHashes = collectContentEntryHashes(
				this,
				root,
				transitiveGraph.hashes,
			);
			internals.serverIslandPageComponents = serverIslandComponents;
		},
	};
}
