import type { SerializedStaticImage } from '../../assets/types.js';
import type { AssetsPrefix } from '../app/types.js';
import type { PrerenderUnattributedMetadata } from '../../types/public/integrations.js';

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
	/** Image transforms resolved, possibly with duplicates. */
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

export interface StaticImageConfig {
	base: string;
	assetsPrefix?: AssetsPrefix;
	assetsDir: string;
}

export interface RenderScopeOptions {
	staticImages?: StaticImageConfig;
}

export interface AmbientCollectors {
	staticImages: SerializedStaticImage[];
	referencedImages: Set<string>;
}

interface RenderChannel {
	scope: RenderCollectorScope | undefined;
	staticImages: StaticImageConfig | undefined;
	ambient: AmbientCollectors;
}

// On globalThis because the build and the bundled prerender runtime load separate copies of this module.
const CHANNEL_KEY = Symbol.for('astro:render-scope');

interface ChannelGlobal {
	[CHANNEL_KEY]?: RenderChannel;
}

function getChannel(): RenderChannel | undefined {
	return (globalThis as ChannelGlobal)[CHANNEL_KEY];
}

// First install wins, so every module copy converges on one channel.
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

export function hasRenderChannel(): boolean {
	return getChannel() !== undefined;
}

export function getInstalledRenderScope(): RenderCollectorScope | undefined {
	return getChannel()?.scope;
}

export function getStaticImageConfig(): StaticImageConfig | undefined {
	return getChannel()?.staticImages;
}

export function uninstallRenderScope(): void {
	delete (globalThis as ChannelGlobal)[CHANNEL_KEY];
}

export function getRenderCollectors(): RenderCollectors | undefined {
	return getChannel()?.scope?.getStore();
}

export function getRecordTarget(): RenderCollectors | undefined {
	const channel = getChannel();
	if (!channel) return undefined;
	return channel.scope?.getStore() ?? channel.ambient;
}

export function drainAmbientCollectors(): PrerenderUnattributedMetadata {
	const ambient = getChannel()?.ambient;
	if (!ambient) return { staticImages: [], referencedImages: [] };
	const drained = {
		staticImages: ambient.staticImages.splice(0),
		referencedImages: [...ambient.referencedImages],
	};
	ambient.referencedImages.clear();
	return drained;
}
