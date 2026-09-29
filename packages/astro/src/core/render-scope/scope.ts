import type { SerializedStaticImage } from '../../assets/types.js';
import type { AssetsPrefix } from '../app/types.js';

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
	/** Absolute source paths of images referenced without a transform. */
	referencedImages?: Set<string>;
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
 * How `getImage()` resolves transforms to files emitted at build time. Present
 * only while prerendering in a runtime that emits optimized images as static
 * files; when absent, `getImage()` returns on-demand (`/_image`) URLs.
 */
export interface StaticImageConfig {
	/** `config.base` */
	base: string;
	/** `config.build.assetsPrefix` */
	assetsPrefix?: AssetsPrefix;
	/** `config.build.assets` */
	assetsDir: string;
}

export interface RenderScopeOptions {
	/** Resolve image transforms to static files. Omit to keep on-demand URLs. */
	staticImages?: StaticImageConfig;
}

/**
 * Image records made while no render is in scope: `getImage()` in
 * `getStaticPaths()` or at module top level, or every record when the runtime
 * could not provide an async context (`scope` undefined).
 */
export interface AmbientCollectors {
	staticImages: SerializedStaticImage[];
	referencedImages: Set<string>;
}

interface RenderChannel {
	scope: RenderCollectorScope | undefined;
	staticImages: StaticImageConfig | undefined;
	ambient: AmbientCollectors;
}

/**
 * The channel is a write-once *conduit* shared so every compiled copy of this
 * module resolves the same channel (the prerender runtime is bundled, so the
 * build orchestrator and the bundled runtime hold different module instances
 * of this file). Per-render state lives in stores reachable only through async
 * execution context; the ambient store is drained by whoever installed the
 * channel. Never installed in dev or production SSR.
 */
const CHANNEL_KEY = Symbol.for('astro:render-scope');

interface ChannelGlobal {
	[CHANNEL_KEY]?: RenderChannel;
}

function getChannel(): RenderChannel | undefined {
	return (globalThis as ChannelGlobal)[CHANNEL_KEY];
}

/**
 * Installs the render channel and returns the installed per-render scope.
 * First-wins: when a channel is already installed (possibly by another module
 * instance), it is kept and the arguments are discarded, so callers that both
 * awaited an import converge on one channel.
 *
 * `scope` may be `undefined` when the runtime has no AsyncLocalStorage: images
 * are then still resolved (and recorded into the ambient store), only per-page
 * attribution is lost.
 */
export function installRenderScope(
	scope: RenderCollectorScope | undefined,
	options: RenderScopeOptions = {},
): RenderCollectorScope | undefined {
	const host = globalThis as ChannelGlobal;
	const existing = host[CHANNEL_KEY];
	if (existing) return existing.scope;
	const channel: RenderChannel = {
		scope,
		staticImages: options.staticImages ? { ...options.staticImages } : undefined,
		ambient: { staticImages: [], referencedImages: new Set() },
	};
	Object.freeze(channel);
	Object.defineProperty(host, CHANNEL_KEY, {
		value: channel,
		configurable: true,
		writable: false,
		enumerable: false,
	});
	return scope;
}

/** The installed per-render scope, or `undefined` when none was installed. */
export function getInstalledRenderScope(): RenderCollectorScope | undefined {
	return getChannel()?.scope;
}

/** The static image configuration, or `undefined` when images resolve on demand. */
export function getStaticImageConfig(): StaticImageConfig | undefined {
	return getChannel()?.staticImages;
}

/** Removes the installed channel. Called by the installer once it is done with it. */
export function uninstallRenderScope(): void {
	delete (globalThis as ChannelGlobal)[CHANNEL_KEY];
}

/** The current render's collectors store, or `undefined` when not collecting. */
export function getRenderCollectors(): RenderCollectors | undefined {
	return getChannel()?.scope?.getStore();
}

/**
 * Where a record made right now lands: the active render's store, else the
 * ambient store. `undefined` when no channel is installed.
 */
export function getRecordTarget(): RenderCollectors | undefined {
	const channel = getChannel();
	if (!channel) return undefined;
	return channel.scope?.getStore() ?? channel.ambient;
}

/**
 * Returns everything recorded outside of a render since the last drain, and
 * empties the ambient store.
 */
export function drainAmbientCollectors(): {
	staticImages: SerializedStaticImage[];
	referencedImages: string[];
} {
	const ambient = getChannel()?.ambient;
	if (!ambient) return { staticImages: [], referencedImages: [] };
	const drained = {
		staticImages: ambient.staticImages.splice(0),
		referencedImages: [...ambient.referencedImages],
	};
	ambient.referencedImages.clear();
	return drained;
}
