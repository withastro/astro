import crypto from 'node:crypto';
import type { Plugin as VitePlugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import { moduleIsTopLevelPage } from '../graph.js';
import { isContentDataIncrementalModule } from '../incremental-metadata.js';
import type { BuildInternals } from '../internal.js';
import { getPageDataByViteID } from '../internal.js';

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
 * A `client:only` component is never part of the prerender module graph, so the
 * per-route hash cannot see it. Its client bundle, and everything it imports, is
 * emitted with a content-hashed URL into the page's `<astro-island>` markup, so a
 * change to the component or any of its dependencies must re-render the page.
 * During the client build we hash each client-only component's transitive graph
 * and fold it into the dependency hash of every route that uses it.
 */
function foldClientOnlyDependencies(graph: ModuleGraph, internals: BuildInternals): void {
	const baseHashes = internals.pageDependencyHashes;
	if (!baseHashes) return;

	const clientOnlyHashesByComponent = new Map<string, string[]>();
	for (const clientOnlyId of internals.discoveredClientOnlyComponents.keys()) {
		const pages = internals.pagesByClientOnly.get(clientOnlyId);
		if (!pages?.size) continue;

		const hash = hashModules(graph, collectTransitiveDeps(graph, clientOnlyId));
		for (const pageData of pages) {
			let list = clientOnlyHashesByComponent.get(pageData.component);
			if (!list) {
				list = [];
				clientOnlyHashesByComponent.set(pageData.component, list);
			}
			list.push(hash);
		}
	}

	for (const [component, clientOnlyHashes] of clientOnlyHashesByComponent) {
		const hasher = crypto.createHash('sha256');
		hasher.update(baseHashes.get(component) ?? '');
		for (const hash of clientOnlyHashes.sort()) {
			hasher.update('\n');
			hasher.update(hash);
		}
		baseHashes.set(component, hasher.digest('hex'));
	}
}

/**
 * Captures a dependency hash for each prerendered page route during the build.
 *
 * The base hash is derived during the prerender build from the sorted set of all
 * transitive module dependencies of the page, so any change to the page's
 * template, layouts, components, or utilities produces a different hash. During
 * the client build, the hash of each `client:only` component's own module graph
 * is folded in, since those components never enter the prerender graph.
 */
export function pluginIncremental(internals: BuildInternals): VitePlugin {
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
				foldClientOnlyDependencies(this, internals);
				return;
			}

			const hashes = new Map<string, string>();
			for (const id of this.getModuleIds()) {
				const info = this.getModuleInfo(id);
				if (!info) continue;
				if (!moduleIsTopLevelPage(info)) continue;

				const pageData = getPageDataByViteID(internals, info.id);
				if (!pageData) continue;

				const deps = collectTransitiveDeps(this, info.id);
				// Key by component path (e.g. "src/pages/blog/[slug].astro")
				hashes.set(pageData.component, hashModules(this, deps));
			}

			internals.pageDependencyHashes = hashes;
		},
	};
}
