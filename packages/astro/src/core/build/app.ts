import { BaseApp } from '../app/entrypoints/index.js';
import type { LogRequestPayload } from '../app/base.js';
import type { SSRManifest } from '../app/types.js';
import type { ComponentInstance } from '../../types/astro.js';
import type { GetStaticPathsItem, GetStaticPathsResultKeyed } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { getEnvironment } from '../environment/index.js';
import { getRouteCache, type RouteCache } from '../render/route-cache.js';
import { stringifyParams } from '../routing/params.js';
import type { BuildEnvironmentSlots } from './environment.js';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';

/**
 * The build / prerender facade: a thin shell over the
 * build environment record. The two-phase init state (`setInternals` /
 * `setOptions`, injected by `createDefaultPrerenderer.setup()` after the
 * prerender bundle import) lives in the `BuildEnvironmentSlots` closure
 * created by the prerender entrypoint; the facade only forwards across the
 * bundle boundary into those slots.
 */
export class BuildApp extends BaseApp {
	#buildEnv: BuildEnvironmentSlots;

	constructor(manifest: SSRManifest, buildEnv: BuildEnvironmentSlots) {
		super(manifest);
		this.#buildEnv = buildEnv;
	}

	isDev(): boolean {
		// Preserved quirk: the build app reports dev so shared code paths keep
		// their build-time behavior.
		return true;
	}

	/**
	 * Streaming falls through to the environment default
	 * (`manifest.serverLike` for the build environment) — we can skip
	 * streaming in SSG for performance, as writing strings is faster.
	 */
	protected override resolveStreaming(): boolean | undefined {
		return undefined;
	}

	public setInternals(internals: BuildInternals) {
		this.#buildEnv.setInternals(internals);
	}

	public setOptions(options: StaticBuildOptions) {
		this.#buildEnv.setOptions(options);
		this.logger.setDestination(options.logger.options.destination);
		this.resetAdapterLogger();
	}

	public getOptions() {
		return this.#buildEnv.getOptions();
	}

	public getSettings() {
		return this.#buildEnv.getSettings();
	}

	/**
	 * Route cache and component loader for `StaticPaths`. Defined on the app
	 * (rather than reached through the functional core at the call site) so
	 * they execute inside the prerender bundle's module graph: the default
	 * prerenderer constructs `StaticPaths` from a different bundle, whose
	 * copies of the core modules hold separate per-manifest state.
	 */
	get routeCache(): RouteCache {
		return getRouteCache(this.manifest);
	}

	getComponentByRoute(routeData: RouteData): Promise<ComponentInstance> {
		return getEnvironment(this.manifest).getComponentByRoute(this.manifest, routeData);
	}

	async setStaticPath(routeData: RouteData, item: GetStaticPathsItem) {
		const mod = await this.getComponentByRoute(routeData);
		const cached = this.routeCache.get(routeData);
		const key = stringifyParams(item.params, routeData, this.manifest.trailingSlash);
		if (cached?.mod === mod) {
			const previous = cached.staticPaths.keyed.get(key);
			if (!previous) cached.staticPaths.push(item);
			cached.staticPaths.keyed.set(key, item);
			return previous;
		}
		const staticPaths = Object.assign([item], {
			keyed: new Map([[key, item]]),
		}) as GetStaticPathsResultKeyed;
		this.routeCache.set(routeData, { mod, staticPaths });
	}

	deleteStaticPaths(routeData: RouteData, items: Set<GetStaticPathsItem>) {
		const cached = this.routeCache.get(routeData);
		if (!cached) return;
		let nextIndex = 0;
		for (const item of cached.staticPaths) {
			if (items.has(item)) {
				const key = stringifyParams(item.params, routeData, this.manifest.trailingSlash);
				if (cached.staticPaths.keyed.get(key) === item) cached.staticPaths.keyed.delete(key);
			} else {
				cached.staticPaths[nextIndex++] = item;
			}
		}
		cached.staticPaths.length = nextIndex;
	}

	deleteStaticPath(
		routeData: RouteData,
		item: GetStaticPathsItem,
		previous: GetStaticPathsItem | undefined,
	) {
		const cached = this.routeCache.get(routeData);
		if (!cached) return;
		const key = stringifyParams(item.params, routeData, this.manifest.trailingSlash);
		if (cached.staticPaths.keyed.get(key) !== item) return;
		if (previous) {
			cached.staticPaths.keyed.set(key, previous);
			return;
		}
		cached.staticPaths.keyed.delete(key);
		const index = cached.staticPaths.indexOf(item);
		if (index !== -1) cached.staticPaths.splice(index, 1);
	}

	logRequest(_options: LogRequestPayload) {}
}
