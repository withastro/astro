import { fileURLToPath } from 'node:url';
import type { RouterConfig } from '../config.js';
import { hasNonPrerenderedRoute } from './core/routing/helpers.js';
import type { BuildDoneResult, FetchHandlerDefinition, RouterPluginApi } from './plugin.js';
import type {
	InjectedRoute,
	PrerenderDoneContext,
	PrerenderPathRestoredContext,
	RouteData,
	RouteTransform,
} from '../types.js';

import { normalizePath, type ResolvedConfig } from 'vite';
import { getRouterApi } from './plugin.js';

const PLUGIN_NAME = '@astrojs/vite-plugin-router';

const registries = new WeakMap<RouterPluginApi, RouterRegistry>();

/** Returns the registry behind the `router()` API registered in `config`. */
export function getRouterRegistry(config: ResolvedConfig): RouterRegistry {
	return registries.get(getRouterApi(config))!;
}

/** A fetch handler registration with its entrypoint normalized to a module specifier. */
export interface FetchHandlerRegistration {
	name: string;
	entrypoint: string;
	order: 'pre' | 'post';
}

/** A page script registration with its entrypoint normalized to a module specifier. */
export interface PageScriptRegistration {
	entrypoint: string;
	devOnly: boolean;
}

/**
 * Holds everything registered through `RouterPluginApi`. One instance is shared by the plugins
 * that `router()` returns; they read registrations when generating virtual modules.
 */
export class RouterRegistry {
	readonly injectedRoutes: InjectedRoute[] = [];
	/** Routes injected with `{ internal: true }`, in registration order. */
	readonly internalRoutes: InjectedRoute[] = [];
	readonly middleware: { pre: string[]; post: string[] } = { pre: [], post: [] };
	readonly fetchHandlers: FetchHandlerRegistration[] = [];
	/** Manifest key → module specifier. */
	readonly manifestExtensions = new Map<string, string>();
	/** Render context key → module specifier. */
	readonly renderContextExtensions = new Map<string, string>();
	/** Manifest key → JSON-serializable value, or a function returning it. */
	readonly manifestData = new Map<string, unknown>();
	/** Module specifiers of the routing extensions, in registration order. */
	readonly routingExtensions: string[] = [];
	/** Module specifiers of the client router init modules, in registration order. */
	readonly clientRouterInits: string[] = [];
	/** Page scripts, in registration order. */
	readonly pageScripts: PageScriptRegistration[] = [];
	/** Route table transforms, in registration order. */
	readonly routeTransforms: RouteTransform[] = [];
	/** Page file extensions added with `addPageExtension()`, in registration order. */
	readonly pageExtensions: string[] = [];
	readonly #routesResolvedCallbacks: Array<(routes: readonly RouteData[]) => void | Promise<void>> =
		[];
	readonly #buildDoneCallbacks: Array<(result: BuildDoneResult) => void | Promise<void>> = [];
	readonly #prerenderDoneCallbacks: Array<(context: PrerenderDoneContext) => void | Promise<void>> =
		[];
	readonly #prerenderPathRestoredCallbacks: Array<(context: PrerenderPathRestoredContext) => void> =
		[];
	#routes: readonly RouteData[] | undefined;
	#frozen = false;
	readonly #resolveConfig: ((config: ResolvedConfig) => RouterConfig) | undefined;
	#viteConfig: ResolvedConfig | undefined;
	#config: RouterConfig | undefined;

	readonly api: RouterPluginApi;

	/**
	 * @param resolveConfig Computes `config` from Vite's resolved config. Called lazily, on the
	 * first read after each `reset()`, so it can read other plugins' APIs.
	 */
	constructor(resolveConfig?: (config: ResolvedConfig) => RouterConfig) {
		this.#resolveConfig = resolveConfig;
		const registry = this;
		this.api = {
			injectRoute(route, options) {
				registry.#assertOpen('injectRoute');
				(options?.internal ? registry.internalRoutes : registry.injectedRoutes).push(route);
			},
			addMiddleware(entrypoint, order) {
				registry.#assertOpen('addMiddleware');
				registry.middleware[order].push(toSpecifier(entrypoint));
			},
			addFetchHandler(name, handler: FetchHandlerDefinition) {
				registry.#assertOpen('addFetchHandler');
				if (registry.fetchHandlers.some((h) => h.name === name)) {
					throw new Error(`${PLUGIN_NAME}: a fetch handler named "${name}" is already registered.`);
				}
				registry.fetchHandlers.push({
					name,
					entrypoint: toSpecifier(handler.entrypoint),
					order: handler.order,
				});
			},
			extendManifest(key, moduleId) {
				registry.#assertOpen('extendManifest');
				registry.#assertUniqueKey(registry.manifestExtensions, 'manifest', key);
				registry.manifestExtensions.set(key, moduleId);
			},
			setManifestData(key, value) {
				registry.#assertOpen('setManifestData');
				registry.#assertUniqueKey(registry.manifestData, 'manifest data', key);
				registry.manifestData.set(key, value);
			},
			extendRouting(entrypoint) {
				registry.#assertOpen('extendRouting');
				registry.routingExtensions.push(toSpecifier(entrypoint));
			},
			extendRenderContext(key, entrypoint) {
				registry.#assertOpen('extendRenderContext');
				registry.#assertUniqueKey(registry.renderContextExtensions, 'render context', key);
				registry.renderContextExtensions.set(key, toSpecifier(entrypoint));
			},
			addClientRouterInit(entrypoint) {
				registry.#assertOpen('addClientRouterInit');
				registry.clientRouterInits.push(toSpecifier(entrypoint));
			},
			addPageScript(entrypoint, options) {
				registry.#assertOpen('addPageScript');
				registry.pageScripts.push({
					entrypoint: toSpecifier(entrypoint),
					devOnly: options?.devOnly ?? false,
				});
			},
			addPageExtension(extension) {
				registry.#assertOpen('addPageExtension');
				if (!registry.pageExtensions.includes(extension)) registry.pageExtensions.push(extension);
			},
			onRoutesResolved(callback) {
				registry.#routesResolvedCallbacks.push(callback);
			},
			transformRoutes(transform) {
				registry.#assertOpen('transformRoutes');
				registry.routeTransforms.push(transform);
			},
			onBuildDone(callback) {
				registry.#buildDoneCallbacks.push(callback);
			},
			onPrerenderDone(callback) {
				registry.#prerenderDoneCallbacks.push(callback);
			},
			onPrerenderPathRestored(callback) {
				registry.#prerenderPathRestoredCallbacks.push(callback);
			},
			get routes(): readonly RouteData[] {
				if (!registry.#routes) {
					throw new Error(
						`${PLUGIN_NAME}: \`routes\` was read before the route table was resolved.`,
					);
				}
				return registry.#routes;
			},
			get config(): RouterConfig {
				return registry.config;
			},
			hasServerOutput(): boolean {
				return (
					registry.config.serverOutput !== undefined ||
					hasNonPrerenderedRoute([...registry.api.routes])
				);
			},
		};
		registries.set(this.api, this);
	}

	/**
	 * Drops every registration. Vite runs `configResolved` hooks again each time a config is
	 * resolved with the same plugin instances (the build resolves more than once), so the API
	 * plugin calls this before the other hooks run.
	 */
	reset(config?: ResolvedConfig): void {
		this.#viteConfig = config;
		this.#config = undefined;
		this.injectedRoutes.length = 0;
		this.internalRoutes.length = 0;
		this.middleware.pre.length = 0;
		this.middleware.post.length = 0;
		this.fetchHandlers.length = 0;
		this.manifestExtensions.clear();
		this.renderContextExtensions.clear();
		this.manifestData.clear();
		this.routingExtensions.length = 0;
		this.clientRouterInits.length = 0;
		this.pageScripts.length = 0;
		this.routeTransforms.length = 0;
		this.pageExtensions.length = 0;
		this.#routesResolvedCallbacks.length = 0;
		this.#buildDoneCallbacks.length = 0;
		this.#prerenderDoneCallbacks.length = 0;
		this.#prerenderPathRestoredCallbacks.length = 0;
		this.#routes = undefined;
		this.#frozen = false;
	}

	/**
	 * The project configuration, available from `configResolved` hooks (default order) on.
	 *
	 * @throws {Error} When read before Vite resolved its config, or when the registry was created
	 * without a config resolver.
	 */
	get config(): RouterConfig {
		if (!this.#config) {
			if (!this.#resolveConfig || !this.#viteConfig) {
				throw new Error(`${PLUGIN_NAME}: \`config\` was read before Vite resolved its config.`);
			}
			this.#config = this.#resolveConfig(this.#viteConfig);
		}
		return this.#config;
	}

	/**
	 * Returns the module specifiers of the page scripts for `command`: every registration in dev,
	 * the ones without `devOnly` in a build.
	 */
	getPageScripts(command: 'dev' | 'build'): string[] {
		return this.pageScripts
			.filter((script) => command === 'dev' || !script.devOnly)
			.map((script) => script.entrypoint);
	}

	/**
	 * Rejects further registrations. Called once the first module that reads registrations is
	 * generated, so a late registration fails loudly instead of being silently ignored.
	 */
	freeze(): void {
		this.#frozen = true;
	}

	/** Stores the resolved route table and runs `onRoutesResolved` callbacks. */
	async setRoutes(routes: readonly RouteData[]): Promise<void> {
		this.#routes = routes;
		for (const callback of this.#routesResolvedCallbacks) {
			await callback(routes);
		}
	}

	/** Runs `onBuildDone` callbacks. */
	async buildDone(result: BuildDoneResult): Promise<void> {
		for (const callback of this.#buildDoneCallbacks) {
			await callback(result);
		}
	}

	/**
	 * Returns the `setManifestData()` entries, calling the ones registered as functions. Freezes
	 * the registry.
	 */
	serializeManifestData(): Record<string, unknown> {
		this.freeze();
		const data: Record<string, unknown> = {};
		for (const [key, value] of this.manifestData) {
			data[key] = typeof value === 'function' ? value() : value;
		}
		return data;
	}

	/** Runs `onPrerenderDone` callbacks. */
	async prerenderDone(context: PrerenderDoneContext): Promise<void> {
		for (const callback of this.#prerenderDoneCallbacks) {
			await callback(context);
		}
	}

	/** Runs `onPrerenderPathRestored` callbacks. */
	prerenderPathRestored(context: PrerenderPathRestoredContext): void {
		for (const callback of this.#prerenderPathRestoredCallbacks) {
			callback(context);
		}
	}

	#assertOpen(member: string): void {
		if (this.#frozen) {
			throw new Error(
				`${PLUGIN_NAME}: \`${member}\` was called after the server modules were generated. Call it from a \`configResolved\` hook.`,
			);
		}
	}

	#assertUniqueKey(map: Map<string, unknown>, kind: string, key: string): void {
		if (map.has(key)) {
			throw new Error(`${PLUGIN_NAME}: the ${kind} key "${key}" is already registered.`);
		}
	}
}

function toSpecifier(entrypoint: string | URL): string {
	return typeof entrypoint === 'string' ? entrypoint : fileURLToPath(entrypoint);
}

/** Returns the URL the dev server serves the page script `specifier` at. */
export function getDevPageScriptSrc(specifier: string): string {
	return '/@id/' + normalizePath(specifier);
}
