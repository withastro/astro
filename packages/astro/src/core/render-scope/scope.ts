import type { SerializedStaticImage } from '../../assets/types.js';

/**
 * The per-render store. One instance is created per collecting render and is
 * reachable only through the installed {@link RenderCollectorScope} while that
 * render's async execution is in scope. Fields are optional so record helpers
 * tolerate stores created by a different astro module instance (or version)
 * that only knows a subset of collectors.
 */
export interface RenderCollectors {
	/** Root-relative `filePath`s of the content entries rendered. */
	contentEntries?: Set<string>;
	/**
	 * Every image transform resolved, dedup hits included; array push,
	 * duplicates preserved.
	 */
	staticImages?: SerializedStaticImage[];
}

/**
 * Structurally satisfied by `AsyncLocalStorage<RenderCollectors>` — deliberate:
 * installing an ALS instance directly IS the only shipped implementation.
 */
export interface RenderCollectorScope {
	run<T>(store: RenderCollectors, fn: () => T): T;
	getStore(): RenderCollectors | undefined;
}

/**
 * The channel is a write-once immutable *conduit* shared so every compiled copy
 * of this module resolves the same AsyncLocalStorage instance (the prerender
 * runtime is bundled, so the build orchestrator and the bundled runtime hold
 * different module instances of this file); all mutable per-render state lives
 * in stores reachable only through async execution context. Never installed in
 * dev or production SSR.
 */
const SCOPE_KEY = Symbol.for('astro:render-scope');

interface ScopeGlobal {
	[SCOPE_KEY]?: RenderCollectorScope;
}

/**
 * Installs a render scope on the process-wide channel and returns the installed
 * scope. First-wins: when a scope is already installed (possibly by another
 * module instance), the existing scope is returned and the argument discarded,
 * so callers that both awaited an import converge on one scope.
 */
export function installRenderScope(scope: RenderCollectorScope): RenderCollectorScope {
	const host = globalThis as ScopeGlobal;
	const existing = host[SCOPE_KEY];
	if (existing) return existing;
	Object.defineProperty(host, SCOPE_KEY, {
		value: scope,
		configurable: true,
		writable: false,
		enumerable: false,
	});
	return scope;
}

/** The installed render scope, or `undefined` when none was installed. */
export function getInstalledRenderScope(): RenderCollectorScope | undefined {
	return (globalThis as ScopeGlobal)[SCOPE_KEY];
}

/** Test-only: remove the installed scope so unit tests can reset the channel. */
export function uninstallRenderScope(): void {
	delete (globalThis as ScopeGlobal)[SCOPE_KEY];
}

/** The current render's collectors store, or `undefined` when not collecting. */
export function getRenderCollectors(): RenderCollectors | undefined {
	return getInstalledRenderScope()?.getStore();
}
