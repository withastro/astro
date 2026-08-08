import type { $ZodType } from 'zod/v4/core';
import type { ActionAccept, ActionClient } from '../../actions/runtime/types.js';
import { getAction, getActions, clearActions } from '../../actions/load.js';
import type { ComponentInstance, RoutesList } from '../../types/astro.js';
import type { RouteData, SSRActions } from '../../types/public/internal.js';
import type { ServerIslandMappings } from './types.js';
import type { SinglePageBuiltModule } from '../build/types.js';
import { getCacheProvider } from '../cache/provider.js';
import type { CacheProvider } from '../cache/types.js';
import { getEnvironment } from '../environment/index.js';
import { getUsedFeatures } from '../fetch/features.js';
import type { AstroLogger } from '../logger/core.js';
import { getLogger, resolveLoggerDestination } from '../logger/manifest-logger.js';
import { clearMiddleware, getMiddleware } from '../middleware/load.js';
import { getRouteCache, type RouteCache } from '../render/route-cache.js';
import {
	getRouteTable,
	matchAllRoutes,
	matchRoute,
	type RouteTable,
	updateRouteTable,
} from '../routing/route-table.js';
import { getServerIslands } from '../server-islands/mappings.js';
import { getSessionDriver } from '../session/driver.js';
import type { SessionDriverFactory } from '../session/types.js';
import type { SSRManifest } from './types.js';

/**
 * Compatibility shim for the public `app.pipeline` property (plan-facades
 * §1.3). It holds exactly two readonly plain values (`manifest`, `streaming`)
 * and zero behavior — every member is a one-line delegate to a foundation
 * accessor of the manifest-keyed functional core. It is a *view* over that
 * core: two shims over the same manifest are interchangeable, and nothing
 * anywhere consults shim identity.
 *
 * No core code may import or accept this class (normative grep gate,
 * foundation contract 11): it is referenced only from `base.ts` typing and
 * `createPipeline` implementations.
 *
 * NOTE: `usedFeatures` is get-only on this shim (review §A.3/B4, accepted and
 * changeset-noted) — no in-repo writer remains; an external writer doing
 * `pipeline.usedFeatures |= x` was never a documented surface.
 */
export class AppPipeline {
	readonly manifest: SSRManifest;
	readonly streaming: boolean;

	private constructor(manifest: SSRManifest, streaming: boolean) {
		this.manifest = manifest;
		this.streaming = streaming;
	}

	static create({
		manifest,
		streaming = true,
	}: {
		manifest: SSRManifest;
		streaming?: boolean;
	}): AppPipeline {
		// Warmup, replacing the old Pipeline-ctor router compile and
		// `AppPipeline.create`'s console-logger allocation (contract 8).
		getRouteTable(manifest);
		getLogger(manifest);
		return new AppPipeline(manifest, streaming);
	}

	/** The identity-stable logger for this manifest. */
	get logger(): AstroLogger {
		return getLogger(this.manifest);
	}

	/**
	 * Resolves the logger destination from the manifest and returns the
	 * logger. Lazy and only resolves once. Kept because the node adapter
	 * calls `app.pipeline.getLogger()`.
	 */
	getLogger(): Promise<AstroLogger> {
		return resolveLoggerDestination(this.manifest);
	}

	/** Route data derived from the manifest, used for route matching. */
	get manifestData(): RouteTable {
		return getRouteTable(this.manifest);
	}

	set manifestData(routesList: RoutesList) {
		updateRouteTable(this.manifest, routesList.routes);
	}

	get routeCache(): RouteCache {
		return getRouteCache(this.manifest);
	}

	/**
	 * Bit mask of the features activated by the handler functions. Only
	 * meaningful when a custom `src/fetch.ts` fetch handler is in use.
	 */
	get usedFeatures(): number {
		return getUsedFeatures(this.manifest);
	}

	matchRoute(pathname: string): RouteData | undefined {
		return matchRoute(this.manifest, pathname);
	}

	matchAllRoutes(pathname: string): RouteData[] {
		return matchAllRoutes(this.manifest, pathname);
	}

	rebuildRouter(): void {
		updateRouteTable(this.manifest, getRouteTable(this.manifest).routes);
	}

	getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		return getEnvironment(this.manifest).getComponentByRoute(this.manifest, routeData);
	}

	getModuleForRoute(routeData: RouteData): Promise<SinglePageBuiltModule> {
		return getEnvironment(this.manifest).getModuleForRoute(this.manifest, routeData);
	}

	getMiddleware() {
		return getMiddleware(this.manifest);
	}

	clearMiddleware(): void {
		clearMiddleware(this.manifest);
	}

	getActions(): Promise<SSRActions> {
		return getActions(this.manifest);
	}

	getAction(path: string): Promise<ActionClient<unknown, ActionAccept, $ZodType>> {
		return getAction(this.manifest, path);
	}

	clearActions(): void {
		clearActions(this.manifest);
	}

	getSessionDriver(): Promise<SessionDriverFactory | null> {
		return getSessionDriver(this.manifest);
	}

	getCacheProvider(): Promise<CacheProvider | null> {
		return getCacheProvider(this.manifest);
	}

	getServerIslands(): Promise<ServerIslandMappings> {
		return getServerIslands(this.manifest);
	}
}
