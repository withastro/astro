import { prependForwardSlash } from '@astrojs/internal-helpers/path';
import { type DevEnvironment, type EnvironmentModuleNode, isCSSRequest } from 'vite';
import { PROPAGATED_ASSET_FLAG } from '../core/head-propagation/boundary.js';
import { wrapId } from '../core/vite-id.js';
import {
	RESOLVED_MODULE_DEV_CSS,
	RESOLVED_MODULE_DEV_CSS_ALL,
	RESOLVED_MODULE_DEV_CSS_PREFIX,
} from './const.js';

const PROPAGATED_ASSET_QUERY_PARAM = `?${PROPAGATED_ASSET_FLAG}`;

export const rawRE = /(?:\?|&)raw(?:&|$)/;
export const inlineRE = /(?:\?|&)inline\b/;

/** Whether a module id is a stylesheet whose CSS ends up on the page (not `?raw` or `?inline`). */
export const isBuildableCSSRequest = (request: string): boolean =>
	isCSSRequest(request) && !rawRE.test(request) && !inlineRE.test(request);

/** A stylesheet found while walking a component's module graph in dev. */
export interface CollectedDevStyle {
	/** Browser-safe module id (`\0` prefix wrapped). */
	id: string;
	/** Raw module id, as used by the module graph and transform hooks. */
	idKey: string;
	/** Root-relative URL Vite serves the stylesheet at. */
	url: string;
	content: string;
}

export interface StyleGraphWalkOptions {
	/**
	 * Return `true` for module ids the walk must not descend into, such as the page modules of
	 * other routes.
	 */
	isBoundary?: (id: string) => boolean;
}

/**
 * Ensure all modules reachable from the given module have been fetched and transformed.
 * This is needed for dynamically imported components whose modules may be registered
 * in the graph (via Vite's import analysis) but not yet transformed, meaning their
 * own imports (including CSS) would not be visible during the CSS graph walk.
 */
export async function ensureModulesLoaded(
	env: DevEnvironment,
	mod: EnvironmentModuleNode,
	{ isBoundary }: StyleGraphWalkOptions = {},
	seen = new Set<string>(),
): Promise<void> {
	const id = mod.id ?? mod.url;
	if (seen.has(id)) return;
	seen.add(id);

	for (const imp of mod.importedModules) {
		if (!imp.id) continue;
		if (seen.has(imp.id)) continue;
		// Mirror the stopping point used by collectCSSWithOrder — don't descend into propagated
		// asset modules, as the CSS walk intentionally stops there too.
		if (imp.id.includes(PROPAGATED_ASSET_QUERY_PARAM)) continue;
		if (isBoundary?.(imp.id)) continue;
		// Skip virtual dev-css modules to prevent circular deadlocks with the Cloudflare adapter.
		// The dev-css-all module statically imports all per-route dev-css:* modules, and those
		// modules' load handlers may already be running (waiting on ensureModulesLoaded), causing
		// a permanent deadlock via Vite's _pendingRequests map. These are CSS collector virtuals
		// that don't contain CSS themselves, so skipping them has no effect on CSS injection.
		if (
			imp.id === RESOLVED_MODULE_DEV_CSS ||
			imp.id === RESOLVED_MODULE_DEV_CSS_ALL ||
			imp.id.startsWith(RESOLVED_MODULE_DEV_CSS_PREFIX)
		)
			continue;

		// If this module hasn't been transformed yet, fetch it to populate its importedModules
		if (!imp.transformResult) {
			try {
				await env.fetchModule(imp.id);
			} catch {
				// Module may not be fetchable (e.g., virtual modules that resolve differently).
				// Silently continue — the CSS walk will simply skip modules with empty importedModules.
			}
		}

		// Recursively ensure child modules are loaded
		await ensureModulesLoaded(env, imp, { isBoundary }, seen);
	}
}

/**
 * Walk down the dependency tree to collect CSS with depth/order.
 * Performs depth-first traversal to ensure correct CSS ordering based on import order.
 */
export function* collectCSSWithOrder(
	id: string,
	mod: EnvironmentModuleNode,
	{ isBoundary }: StyleGraphWalkOptions = {},
	seen = new Set<string>(),
): Generator<CollectedDevStyle, void, unknown> {
	seen.add(id);

	// Stop traversing if we reach an asset propagation stopping point to ensure we only collect CSS
	// relevant to a content collection entry, if any. Not doing so could cause CSS from other
	// entries to potentially be collected and bleed into the CSS included on the page, causing
	// unexpected styles, for example when a module shared between 2 pages would import
	// `astro:content` and thus potentially adding multiple content collection entry assets to the
	// module graph.
	if (id.includes(PROPAGATED_ASSET_QUERY_PARAM)) {
		return;
	}

	// Keep all of the imported modules into an array so we can go through them one at a time
	const imported = Array.from(mod.importedModules);

	// Check if this module is CSS and should be collected
	if (isBuildableCSSRequest(id)) {
		yield {
			id: wrapId(mod.id ?? mod.url),
			idKey: id,
			content: '',
			url: prependForwardSlash(wrapId(mod.url)),
		};
		return;
	}
	// ?raw imports the underlying css but is handled as a string in the JS.
	else if (id.endsWith('?raw')) {
		return;
	}

	// Recursively walk imported modules (depth-first)
	for (const imp of imported) {
		if (imp.id && !seen.has(imp?.id)) {
			if (isBoundary?.(imp.id)) continue;
			yield* collectCSSWithOrder(imp.id, imp, { isBoundary }, seen);
		}
	}
}
