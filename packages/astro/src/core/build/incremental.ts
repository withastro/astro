import fs from 'node:fs';
import type { SerializedStaticImage } from '../../assets/types.js';
import { rootRelativePath } from '../viteUtils.js';
import type { AstroSettings } from '../../types/astro.js';

const INCREMENTAL_CACHE_FILE = 'incremental-build.json';
const INCREMENTAL_DIAGNOSTICS_FILE = 'incremental-build-diagnostics.json';
const INCREMENTAL_OUTPUT_DIR = 'dist/';
export const INCREMENTAL_CACHE_VERSION = 1;
const DIAGNOSTICS_VERSION = 1;

export interface IncrementalPathEntry {
	cacheKey: string;
	outputFile: string;
	/**
	 * Render-graph hashes of the content entries this path rendered, keyed by the
	 * entry's root-relative `filePath`. A change to any of these invalidates the
	 * path even when its template and data are unchanged, since content entries
	 * render behind `content-data` bridges the per-route hash cannot cross.
	 */
	contentHashes?: Record<string, string>;
	/**
	 * Optimized-image transforms this path resolved while rendering. Registered
	 * transforms are drained into the output after generation, but `dist/` is
	 * emptied each build, so a skipped path replays these into the global list to
	 * keep the images its restored HTML references from 404ing.
	 */
	staticImages?: SerializedStaticImage[];
	/**
	 * Response header name/value pairs a `staticHeaders` adapter collected for this
	 * path (chiefly the CSP header when delivered as a header rather than a `<meta>`
	 * tag). The `astro:build:generated` hook writes these to a static headers file,
	 * so a skipped path replays them to keep its route in that file.
	 */
	headers?: [string, string][];
}

export interface IncrementalRouteEntry {
	dependencyHash: string;
	paths: Record<string, IncrementalPathEntry>;
}

/**
 * On-disk shape of the incremental build cache.
 */
export interface IncrementalManifest {
	version: number;
	/**
	 * Hash of the output-affecting subset of the resolved config. A mismatch
	 * invalidates the whole cache, since config baked into compiled output or
	 * inlined via Vite cannot be seen by the per-route dependency hash.
	 */
	configHash: string;
	/**
	 * Hash of the project's lockfiles. Externalized dependencies are leaf nodes
	 * in the bundle graph with no code and a versionless id, so the per-route
	 * dependency hash cannot see when a (possibly transitive) dependency changes.
	 * A mismatch invalidates the whole cache.
	 */
	lockfileHash: string;
	/**
	 * Hash of the server-island encryption key. A page's island props are baked
	 * into its HTML as ciphertext bound to this key, so a restored page whose key
	 * has changed would be undecryptable at runtime. Server-island pages are only
	 * reused when this matches; it does not affect pages without islands.
	 */
	keyDigest: string;
	routes: Record<string, IncrementalRouteEntry>;
}

/**
 * Why a previous incremental cache could not be used for this build. `loaded` is
 * reported only for a valid, usable manifest; every other reason explains why
 * the previous build's state was discarded or never read.
 */
export type IncrementalCacheLoadReason =
	| 'loaded'
	| 'forced'
	| 'missing'
	| 'invalid-manifest'
	| 'unreadable'
	| 'version-changed'
	| 'config-changed'
	| 'lockfile-changed';

export interface IncrementalCacheLoadResult {
	/**
	 * The previous build's manifest, when it is valid and usable for reuse
	 * decisions. `null` whenever any load reason other than `loaded` applies.
	 */
	previous: IncrementalManifest | null;
	/**
	 * All load outcomes that apply. `loaded` is mutually exclusive with the
	 * other reasons; a parsed manifest may report several of the `*-changed`
	 * reasons at once (e.g. config and lockfile both changed).
	 */
	reasons: IncrementalCacheLoadReason[];
	/** Parsed manifest version when it differed from the current cache version. */
	previousVersion?: unknown;
	/** Stable Node error code (e.g. `EACCES`) when the manifest could not be read. */
	errorCode?: string;
	/**
	 * Whether a valid previous manifest was written with a different
	 * server-island encryption key digest than this build's. This is not a
	 * global invalidation: only island routes are affected.
	 */
	islandKeyChanged: boolean;
}

/**
 * A per-module fingerprint plus its direct import edges, captured during the
 * build so a later build can explain which modules changed. Stored in the
 * diagnostics sidecar, never in the correctness-critical manifest.
 */
export interface DiagnosticModule {
	/** Hash of the module's own normalized representation plus sorted direct import ids. */
	fingerprint: string;
	importedIds: string[];
	dynamicallyImportedIds: string[];
}

/**
 * The diagnostic snapshot of one build environment's module graph: per-module
 * fingerprints and edges, the roots each prerendered route and content entry
 * are seeded from, and the aggregate route hashes. The aggregate hashes are
 * duplicated from the manifest so a sidecar that does not correspond to the
 * previous manifest (e.g. after an interrupted write) can be detected and
 * ignored without affecting reuse decisions.
 */
export interface DiagnosticGraph {
	modules: Record<string, DiagnosticModule>;
	routeRoots: Record<string, string[]>;
	contentRoots: Record<string, string[]>;
	routeDependencyHashes: Record<string, string>;
}

/**
 * On-disk shape of the incremental build diagnostics sidecar. It is
 * independently versioned and optional: a missing or mismatched sidecar only
 * suppresses detailed dependency explanations, never invalidates cached HTML.
 */
export interface IncrementalDiagnosticsFile {
	version: 1;
	prerender: DiagnosticGraph;
	client: DiagnosticGraph;
}

export function createEmptyDiagnosticGraph(): DiagnosticGraph {
	return { modules: {}, routeRoots: {}, contentRoots: {}, routeDependencyHashes: {} };
}

/**
 * One changed, added, or removed module in a route's dependency graph, with a
 * deterministic display chain from the route root to the leaf.
 */
export interface DependencyChange {
	status: 'changed' | 'added' | 'removed';
	/**
	 * Display nodes from the route root to the changed leaf, sanitized for
	 * console output (root-relative paths, `virtual:` ids). A client-only or
	 * hoisted-script change starts with a `client entry: <id>` boundary node; a
	 * rendered-content change starts with `rendered content: <path>`.
	 */
	chain: string[];
}

/**
 * Why a single path cannot be reused from the previous build. Each reason is
 * independently testable; `checkPath` reports every applicable reason in a
 * stable order so a miss like "module dependencies changed; cacheKey changed"
 * is truthful.
 */
export type IncrementalPathMissReason =
	| { type: 'no-cache-key' }
	| { type: 'global-cache'; reasons: IncrementalCacheLoadReason[] }
	| { type: 'new-route' }
	| { type: 'new-path' }
	| { type: 'island-key-changed' }
	| {
			type: 'route-dependencies-changed';
			changes?: DependencyChange[];
			/** Why no leaf-level explanation is available, when applicable. */
			diagnosticsUnavailable?: 'missing-sidecar' | 'unavailable';
	  }
	| { type: 'cache-key-changed' }
	| {
			type: 'content-dependencies-changed';
			entries: string[];
			changes?: Record<string, DependencyChange[]>;
			diagnosticsUnavailable?: 'missing-sidecar' | 'unavailable';
	  }
	| { type: 'cached-output-missing' };

export type IncrementalPathDecision =
	| { reusable: true }
	| { reusable: false; reasons: IncrementalPathMissReason[] };

type RouteExplanation =
	| { changes: DependencyChange[] }
	| { unavailable: 'missing-sidecar' | 'unavailable' };

type EntryExplanation =
	| { changes: DependencyChange[] }
	| { unavailable: 'missing-sidecar' | 'unavailable' }
	| null;

interface GraphDiff {
	changed: Set<string>;
	added: Set<string>;
	removed: Set<string>;
}

function getManifestFile(settings: AstroSettings): URL {
	return new URL(INCREMENTAL_CACHE_FILE, settings.config.cacheDir);
}

function getDiagnosticsFile(settings: AstroSettings): URL {
	return new URL(INCREMENTAL_DIAGNOSTICS_FILE, settings.config.cacheDir);
}

function getCachedOutputFile(settings: AstroSettings, outputFile: string): URL {
	return new URL(outputFile, new URL(INCREMENTAL_OUTPUT_DIR, settings.config.cacheDir));
}

/**
 * Read the previous manifest and classify why it cannot be used, if at all.
 * All applicable version/config/lockfile mismatches of a parsed manifest are
 * collected before the manifest is discarded, so simultaneous changes produce
 * multiple reasons. `--force` short-circuits before any disk access.
 */
function readLoadResult(
	settings: AstroSettings,
	expectedConfigHash: string,
	expectedLockfileHash: string,
	keyDigest: string,
): IncrementalCacheLoadResult {
	try {
		const raw = fs.readFileSync(getManifestFile(settings), 'utf-8');
		let data: IncrementalManifest;
		try {
			data = JSON.parse(raw) as IncrementalManifest;
		} catch {
			return { previous: null, reasons: ['invalid-manifest'], islandKeyChanged: false };
		}
		if (
			typeof data !== 'object' ||
			data === null ||
			typeof data.version !== 'number' ||
			typeof data.configHash !== 'string' ||
			typeof data.lockfileHash !== 'string' ||
			typeof data.keyDigest !== 'string' ||
			typeof data.routes !== 'object' ||
			data.routes === null
		) {
			return { previous: null, reasons: ['invalid-manifest'], islandKeyChanged: false };
		}
		const reasons: IncrementalCacheLoadReason[] = [];
		if (data.version !== INCREMENTAL_CACHE_VERSION) reasons.push('version-changed');
		if (data.configHash !== expectedConfigHash) reasons.push('config-changed');
		if (data.lockfileHash !== expectedLockfileHash) reasons.push('lockfile-changed');
		if (reasons.length > 0) {
			return {
				previous: null,
				reasons,
				previousVersion: data.version !== INCREMENTAL_CACHE_VERSION ? data.version : undefined,
				islandKeyChanged: false,
			};
		}
		return { previous: data, reasons: ['loaded'], islandKeyChanged: data.keyDigest !== keyDigest };
	} catch (err) {
		const code = (err as NodeJS.ErrnoException)?.code;
		if (code === 'ENOENT') return { previous: null, reasons: ['missing'], islandKeyChanged: false };
		return { previous: null, reasons: ['unreadable'], errorCode: code, islandKeyChanged: false };
	}
}

function isValidDiagnosticGraph(graph: unknown): graph is DiagnosticGraph {
	if (typeof graph !== 'object' || graph === null) return false;
	const candidate = graph as DiagnosticGraph;
	return (
		typeof candidate.modules === 'object' &&
		candidate.modules !== null &&
		typeof candidate.routeRoots === 'object' &&
		candidate.routeRoots !== null &&
		typeof candidate.contentRoots === 'object' &&
		candidate.contentRoots !== null &&
		typeof candidate.routeDependencyHashes === 'object' &&
		candidate.routeDependencyHashes !== null
	);
}

function readDiagnostics(settings: AstroSettings): IncrementalDiagnosticsFile | null {
	try {
		const raw = fs.readFileSync(getDiagnosticsFile(settings), 'utf-8');
		const data = JSON.parse(raw) as IncrementalDiagnosticsFile;
		if (
			typeof data !== 'object' ||
			data === null ||
			data.version !== DIAGNOSTICS_VERSION ||
			!isValidDiagnosticGraph(data.prerender) ||
			!isValidDiagnosticGraph(data.client)
		) {
			return null;
		}
		return data;
	} catch {
		return null;
	}
}

function diffGraphs(current: DiagnosticGraph, previous: DiagnosticGraph): GraphDiff {
	const changed = new Set<string>();
	const added = new Set<string>();
	for (const [id, module] of Object.entries(current.modules)) {
		const previousModule = previous.modules[id];
		if (!previousModule) added.add(id);
		else if (previousModule.fingerprint !== module.fingerprint) changed.add(id);
	}
	const removed = new Set<string>();
	for (const id of Object.keys(previous.modules)) {
		if (!(id in current.modules)) removed.add(id);
	}
	return { changed, added, removed };
}

/**
 * Turn a raw module id into something printable: root-relative project paths,
 * `node_modules/...` under the project root, and `virtual:` ids. The project's
 * absolute root is never printed.
 */
function sanitizeModuleId(id: string, root: URL): string {
	if (id.startsWith('\0')) return 'virtual:' + id.slice(1);
	if (id.startsWith('/@fs/')) return sanitizeModuleId(id.slice('/@fs'.length), root);
	return rootRelativePath(root, id, false);
}

/**
 * Breadth-first search from a route's root modules to every changed/added leaf
 * in `leaves`, returning one shortest deterministic chain per leaf. Roots are
 * visited in sorted order and neighbors in sorted order, so output is stable
 * across concurrent builds.
 *
 * `displayRoot` maps a root module id to its display node (e.g. a
 * `client entry:` or `rendered content:` boundary), or `null` to drop the root
 * from the chain (the prerender route root is the route itself and is printed
 * by the caller).
 */
function findLeafChains(
	roots: string[],
	graph: DiagnosticGraph,
	leaves: ReadonlySet<string>,
	status: 'changed' | 'added' | 'removed',
	displayRoot: (id: string) => string | null,
	root: URL,
): DependencyChange[] {
	if (roots.length === 0 || leaves.size === 0) return [];
	const parents = new Map<string, string | null>();
	const queue: string[] = [];
	const seen = new Set<string>();
	for (const rootId of [...roots].sort()) {
		parents.set(rootId, null);
		seen.add(rootId);
		queue.push(rootId);
	}
	const chains: DependencyChange[] = [];
	let head = 0;
	while (head < queue.length) {
		const id = queue[head++];
		if (leaves.has(id)) {
			const chain: string[] = [];
			let current: string | undefined = id;
			while (current !== undefined) {
				chain.push(current);
				const parent = parents.get(current);
				if (parent === undefined || parent === null) break;
				current = parent;
			}
			chain.reverse();
			let displayed = chain.map((nodeId) => sanitizeModuleId(nodeId, root));
			const rootDisplay = displayRoot(chain[0]);
			if (rootDisplay === null) {
				displayed = displayed.slice(1);
			} else {
				displayed[0] = rootDisplay;
			}
			chains.push({ status, chain: displayed });
			if (chains.length >= MAX_EXPLAINED_LEAVES) break;
		}
		const module = graph.modules[id];
		if (!module) continue;
		const neighbors = [...module.importedIds, ...module.dynamicallyImportedIds].sort();
		for (const neighbor of neighbors) {
			if (!seen.has(neighbor) && graph.modules[neighbor] !== undefined) {
				seen.add(neighbor);
				parents.set(neighbor, id);
				queue.push(neighbor);
			}
		}
	}
	return chains;
}

// Bounded so a route whose entire dependency tree changed cannot flood the
// diagnostics sidecar or the console. Explanations are capped per route; the
// aggregate reason is still reported for every dropped leaf.
const MAX_EXPLAINED_LEAVES = 200;

// Placeholder root used only when a cache was constructed without settings;
// production caches always pass the project root.
const ROOT_FALLBACK = new URL('file:///');

/**
 * Tracks which prerendered paths can be reused from a previous build.
 *
 * The invalidation logic (`checkPath`, `record`, `findOrphanedFiles`) is pure
 * and operates on the previous and next manifests held in memory. Disk access
 * is confined to `load` (plus the lazily read diagnostics sidecar) and the
 * output-file methods.
 */
export class IncrementalBuildCache {
	/** Tagged load outcome, used for global invalidation messages. */
	readonly loadResult: IncrementalCacheLoadResult;
	readonly #previous: IncrementalManifest | null;
	readonly #next: IncrementalManifest;
	readonly #contentEntryHashes: Map<string, string>;
	readonly #createdDirs = new Set<string>();
	readonly #settings: AstroSettings | undefined;
	readonly #currentDiagnostics: IncrementalDiagnosticsFile | null;
	/** Lazy-loaded previous diagnostics sidecar; `undefined` until first read. */
	#previousDiagnostics: IncrementalDiagnosticsFile | null | undefined;
	#graphDiff: { prerender: GraphDiff; client: GraphDiff } | null = null;
	#routeChanges = new Map<string, RouteExplanation | null>();
	#contentChanges = new Map<string, EntryExplanation>();

	constructor(
		configHash: string,
		lockfileHash: string,
		keyDigest: string,
		contentEntryHashes = new Map<string, string>(),
		loadResult: IncrementalCacheLoadResult = {
			previous: null,
			reasons: ['missing'],
			islandKeyChanged: false,
		},
		currentDiagnostics: IncrementalDiagnosticsFile | null = null,
		settings: AstroSettings | undefined = undefined,
	) {
		this.loadResult = loadResult;
		this.#previous = loadResult.previous;
		this.#contentEntryHashes = contentEntryHashes;
		this.#currentDiagnostics = currentDiagnostics;
		this.#settings = settings;
		this.#next = {
			version: INCREMENTAL_CACHE_VERSION,
			configHash,
			lockfileHash,
			keyDigest,
			routes: {},
		};
	}

	/**
	 * Load the cache from disk. When no valid manifest exists (missing, wrong
	 * version, or a config or lockfile hash mismatch) the returned cache has no
	 * previous build, so every path is rendered as a full build.
	 *
	 * `contentEntryHashes` is this build's map of content-entry render hashes,
	 * used to detect when the content a path renders has changed.
	 *
	 * `diagnostics` is this build's per-module fingerprint snapshot, written to
	 * the sidecar so the next build can explain dependency changes.
	 *
	 * `force` ignores any existing manifest so every path is rebuilt, while still
	 * recording a fresh cache for the next build.
	 */
	static load(
		settings: AstroSettings,
		configHash: string,
		lockfileHash: string,
		keyDigest: string,
		contentEntryHashes = new Map<string, string>(),
		diagnostics: IncrementalDiagnosticsFile | null = null,
		force = false,
	): IncrementalBuildCache {
		const loadResult = force
			? {
					previous: null,
					reasons: ['forced'] as IncrementalCacheLoadReason[],
					islandKeyChanged: false,
				}
			: readLoadResult(settings, configHash, lockfileHash, keyDigest);
		return new IncrementalBuildCache(
			configHash,
			lockfileHash,
			keyDigest,
			contentEntryHashes,
			loadResult,
			diagnostics,
			settings,
		);
	}

	/**
	 * Determine if a path can be reused from the previous build, and why not if
	 * it cannot. A path is reusable only when every independently testable input
	 * matches the previous build:
	 * 1. It returned a cacheKey in this build.
	 * 2. The previous cache is valid and has an entry for the route.
	 * 3. The route's dependency hash matches the previous build (template code is identical).
	 * 4. The previous cache has an entry for this exact path.
	 * 5. The path's cacheKey matches the previous build (user data is identical).
	 * 6. Every content entry the path rendered last build still has a matching
	 *    render hash (imported components inside that content are unchanged).
	 * 7. If the path renders a server island, the encryption key is unchanged, so
	 *    the ciphertext baked into the restored HTML is still decryptable.
	 *
	 * All applicable miss reasons are returned in a stable order: global cache
	 * state, island key, module dependencies, path existence, cacheKey, content
	 * dependencies. `cached output missing` is deliberately not produced here —
	 * only the caller knows whether current output exists or was restored.
	 */
	checkPath(
		routeComponent: string,
		pathname: string,
		dependencyHash: string,
		cacheKey: string | undefined,
		hasServerIsland = false,
	): IncrementalPathDecision {
		if (cacheKey === undefined) {
			return { reusable: false, reasons: [{ type: 'no-cache-key' }] };
		}
		const loadReasons = this.loadResult.reasons.filter((reason) => reason !== 'loaded');
		if (loadReasons.length > 0) {
			return { reusable: false, reasons: [{ type: 'global-cache', reasons: loadReasons }] };
		}

		const routeEntry = this.#previous?.routes[routeComponent];
		if (!routeEntry) {
			return { reusable: false, reasons: [{ type: 'new-route' }] };
		}

		const reasons: IncrementalPathMissReason[] = [];
		if (hasServerIsland && this.#previous?.keyDigest !== this.#next.keyDigest) {
			reasons.push({ type: 'island-key-changed' });
		}
		if (routeEntry.dependencyHash !== dependencyHash) {
			const explanation = this.explainRoute(routeComponent);
			const reason: Extract<IncrementalPathMissReason, { type: 'route-dependencies-changed' }> = {
				type: 'route-dependencies-changed',
			};
			if (explanation && 'changes' in explanation) {
				if (explanation.changes.length > 0) reason.changes = explanation.changes;
				else reason.diagnosticsUnavailable = 'unavailable';
			} else {
				reason.diagnosticsUnavailable =
					explanation && 'unavailable' in explanation ? explanation.unavailable : 'unavailable';
			}
			reasons.push(reason);
		}

		const pathEntry = routeEntry.paths[pathname];
		if (!pathEntry) {
			reasons.push({ type: 'new-path' });
		} else {
			if (pathEntry.cacheKey !== cacheKey) {
				reasons.push({ type: 'cache-key-changed' });
			}
			if (pathEntry.contentHashes) {
				const changedEntries: string[] = [];
				for (const [entryPath, previousHash] of Object.entries(pathEntry.contentHashes)) {
					if (this.#contentEntryHashes.get(entryPath) !== previousHash)
						changedEntries.push(entryPath);
				}
				if (changedEntries.length > 0) {
					const reason: Extract<
						IncrementalPathMissReason,
						{ type: 'content-dependencies-changed' }
					> = { type: 'content-dependencies-changed', entries: changedEntries };
					const changes: Record<string, DependencyChange[]> = {};
					let unavailable: 'missing-sidecar' | 'unavailable' | null = null;
					for (const entryPath of changedEntries) {
						const entryExplanation = this.explainContent(entryPath);
						if (
							entryExplanation &&
							'changes' in entryExplanation &&
							entryExplanation.changes.length > 0
						) {
							changes[entryPath] = entryExplanation.changes;
						} else if (entryExplanation && 'unavailable' in entryExplanation) {
							unavailable ??= entryExplanation.unavailable;
						} else {
							unavailable ??= 'unavailable';
						}
					}
					if (Object.keys(changes).length > 0) reason.changes = changes;
					if (unavailable) reason.diagnosticsUnavailable = unavailable;
					reasons.push(reason);
				}
			}
		}
		return reasons.length > 0 ? { reusable: false, reasons } : { reusable: true };
	}

	/**
	 * The content entries a path rendered in the previous build, so a skipped path
	 * can carry its content-entry tracking forward without re-rendering.
	 */
	previousContentEntryKeys(routeComponent: string, pathname: string): string[] | undefined {
		const pathEntry = this.#previous?.routes[routeComponent]?.paths[pathname];
		return pathEntry?.contentHashes ? Object.keys(pathEntry.contentHashes) : undefined;
	}

	/**
	 * The image transforms a path resolved in the previous build, so a skipped
	 * path can replay them and carry them forward without re-rendering.
	 */
	previousStaticImages(
		routeComponent: string,
		pathname: string,
	): SerializedStaticImage[] | undefined {
		return this.#previous?.routes[routeComponent]?.paths[pathname]?.staticImages;
	}

	/**
	 * The response headers a path collected in the previous build, so a skipped
	 * path can replay them into a `staticHeaders` adapter's headers file.
	 */
	previousHeaders(routeComponent: string, pathname: string): [string, string][] | undefined {
		return this.#previous?.routes[routeComponent]?.paths[pathname]?.headers;
	}

	/** Record a path in the next manifest so a later build can skip or prune it. */
	record(
		routeComponent: string,
		dependencyHash: string,
		pathname: string,
		cacheKey: string,
		outputFile: string,
		contentEntryKeys?: string[],
		staticImages?: SerializedStaticImage[],
		headers?: [string, string][],
	): void {
		let routeEntry = this.#next.routes[routeComponent];
		if (!routeEntry) {
			routeEntry = { dependencyHash, paths: {} };
			this.#next.routes[routeComponent] = routeEntry;
		}
		routeEntry.dependencyHash = dependencyHash;

		const pathEntry: IncrementalPathEntry = { cacheKey, outputFile };
		if (contentEntryKeys && contentEntryKeys.length > 0) {
			const contentHashes: Record<string, string> = {};
			for (const key of contentEntryKeys) {
				const hash = this.#contentEntryHashes.get(key);
				if (hash !== undefined) contentHashes[key] = hash;
			}
			if (Object.keys(contentHashes).length > 0) pathEntry.contentHashes = contentHashes;
		}
		if (staticImages && staticImages.length > 0) pathEntry.staticImages = staticImages;
		if (headers && headers.length > 0) pathEntry.headers = headers;
		routeEntry.paths[pathname] = pathEntry;
	}

	/**
	 * Cache copies recorded in the previous build that are no longer keyed in this
	 * one, either because the path was removed from `getStaticPaths()` or dropped
	 * its `cacheKey`. Their stored copies are stale and should be pruned. Paths
	 * that are still keyed keep their copies, even when the `cacheKey` changed.
	 */
	findOrphanedFiles(): string[] {
		if (!this.#previous) return [];
		const orphans: string[] = [];
		for (const [routeComponent, routeEntry] of Object.entries(this.#previous.routes)) {
			const nextRouteEntry = this.#next.routes[routeComponent];
			for (const [pathname, pathEntry] of Object.entries(routeEntry.paths)) {
				if (!nextRouteEntry?.paths[pathname]) {
					orphans.push(pathEntry.outputFile);
				}
			}
		}
		return orphans;
	}

	writeManifest(settings: AstroSettings): void {
		const manifestFile = getManifestFile(settings);
		fs.mkdirSync(new URL('./', manifestFile), { recursive: true });
		fs.writeFileSync(manifestFile, JSON.stringify(this.#next, null, '\t'));
	}

	/**
	 * Write this build's diagnostics sidecar next to the manifest. A failure must
	 * not fail the build or affect cache reuse; the caller reports it as a warning.
	 */
	writeDiagnostics(settings: AstroSettings): void {
		if (!this.#currentDiagnostics) return;
		const diagnosticsFile = getDiagnosticsFile(settings);
		fs.mkdirSync(new URL('./', diagnosticsFile), { recursive: true });
		fs.writeFileSync(diagnosticsFile, JSON.stringify(this.#currentDiagnostics));
	}

	async restoreOutputFile(
		settings: AstroSettings,
		outputFile: string,
		destination: URL,
	): Promise<boolean> {
		const cachedOutputFile = getCachedOutputFile(settings, outputFile);
		if (!fs.existsSync(cachedOutputFile)) return false;

		await this.#ensureDir(new URL('./', destination));
		await fs.promises.copyFile(cachedOutputFile, destination);
		return true;
	}

	async writeOutputFile(
		settings: AstroSettings,
		outputFile: string,
		body: string | Uint8Array,
	): Promise<void> {
		const cachedOutputFile = getCachedOutputFile(settings, outputFile);
		await this.#ensureDir(new URL('./', cachedOutputFile));
		await fs.promises.writeFile(cachedOutputFile, body);
	}

	async deleteOutputFile(settings: AstroSettings, outputFile: string): Promise<void> {
		await fs.promises.rm(getCachedOutputFile(settings, outputFile), { force: true });
	}

	/**
	 * Explain a route's dependency change with leaf-level chains, memoized per
	 * route. `null` means the previous manifest had no such route or no previous
	 * manifest exists.
	 */
	explainRoute(routeComponent: string): RouteExplanation | null {
		if (this.#routeChanges.has(routeComponent)) return this.#routeChanges.get(routeComponent)!;
		const explanation = this.#explainRoute(routeComponent);
		this.#routeChanges.set(routeComponent, explanation);
		return explanation;
	}

	#explainRoute(routeComponent: string): RouteExplanation | null {
		const current = this.#currentDiagnostics;
		const previous = this.#loadPreviousDiagnostics();
		if (!current || !previous) return { unavailable: 'missing-sidecar' };
		const previousRoute = this.#previous?.routes[routeComponent];
		if (!previousRoute) return null;
		// A sidecar from a different build (interrupted write) must not be trusted
		// to explain this route; only the aggregate reason is reported then.
		if (previous.prerender.routeDependencyHashes[routeComponent] !== previousRoute.dependencyHash) {
			return { unavailable: 'unavailable' };
		}

		const diffs = this.#loadGraphDiffs(previous);
		const root = this.#settings?.config.root ?? ROOT_FALLBACK;
		const changes: DependencyChange[] = [];

		const prerenderRoots = current.prerender.routeRoots[routeComponent] ?? [];
		changes.push(
			...findLeafChains(
				prerenderRoots,
				current.prerender,
				diffs.prerender.changed,
				'changed',
				() => null,
				root,
			),
			...findLeafChains(
				prerenderRoots,
				current.prerender,
				diffs.prerender.added,
				'added',
				() => null,
				root,
			),
		);
		const previousPrerenderRoots = previous.prerender.routeRoots[routeComponent] ?? [];
		changes.push(
			...findLeafChains(
				previousPrerenderRoots,
				previous.prerender,
				diffs.prerender.removed,
				'removed',
				() => null,
				root,
			),
		);

		const clientRoots = current.client.routeRoots[routeComponent] ?? [];
		const previousClientRoots = previous.client.routeRoots[routeComponent] ?? [];
		if (diffs.client.changed.size > 0) {
			changes.push(
				...findLeafChains(
					clientRoots,
					current.client,
					diffs.client.changed,
					'changed',
					(id) => `client entry: ${sanitizeModuleId(id, root)}`,
					root,
				),
			);
		}
		if (diffs.client.added.size > 0) {
			changes.push(
				...findLeafChains(
					clientRoots,
					current.client,
					diffs.client.added,
					'added',
					(id) => `client entry: ${sanitizeModuleId(id, root)}`,
					root,
				),
			);
		}
		const removedClientLeaves = diffs.client.removed;
		if (removedClientLeaves.size > 0) {
			changes.push(
				...findLeafChains(
					previousClientRoots,
					previous.client,
					removedClientLeaves,
					'removed',
					(id) => `client entry: ${sanitizeModuleId(id, root)}`,
					root,
				),
			);
		}

		if (changes.length === 0) return { unavailable: 'unavailable' };
		return { changes };
	}

	/** Explain a changed content entry's render-graph change, memoized per entry. */
	explainContent(entryPath: string): EntryExplanation {
		if (this.#contentChanges.has(entryPath)) return this.#contentChanges.get(entryPath)!;
		const explanation = this.#explainContent(entryPath);
		this.#contentChanges.set(entryPath, explanation);
		return explanation;
	}

	#explainContent(entryPath: string): EntryExplanation {
		const current = this.#currentDiagnostics;
		const previous = this.#loadPreviousDiagnostics();
		if (!current || !previous) return { unavailable: 'missing-sidecar' };
		const diffs = this.#loadGraphDiffs(previous);
		const root = this.#settings?.config.root ?? ROOT_FALLBACK;
		const currentRoots = current.prerender.contentRoots[entryPath] ?? [];
		const previousRoots = previous.prerender.contentRoots[entryPath] ?? [];
		const changes: DependencyChange[] = [];
		changes.push(
			...findLeafChains(
				currentRoots,
				current.prerender,
				diffs.prerender.changed,
				'changed',
				() => `rendered content: ${entryPath}`,
				root,
			),
			...findLeafChains(
				currentRoots,
				current.prerender,
				diffs.prerender.added,
				'added',
				() => `rendered content: ${entryPath}`,
				root,
			),
		);
		changes.push(
			...findLeafChains(
				previousRoots,
				previous.prerender,
				diffs.prerender.removed,
				'removed',
				() => `rendered content: ${entryPath}`,
				root,
			),
		);
		return changes.length > 0 ? { changes } : { unavailable: 'unavailable' };
	}

	#loadPreviousDiagnostics(): IncrementalDiagnosticsFile | null {
		if (this.#previousDiagnostics !== undefined) return this.#previousDiagnostics;
		if (!this.#settings) return null;
		this.#previousDiagnostics = readDiagnostics(this.#settings);
		return this.#previousDiagnostics;
	}

	#loadGraphDiffs(previous: IncrementalDiagnosticsFile): {
		prerender: GraphDiff;
		client: GraphDiff;
	} {
		if (!this.#graphDiff) {
			const current = this.#currentDiagnostics!;
			this.#graphDiff = {
				prerender: diffGraphs(current.prerender, previous.prerender),
				client: diffGraphs(current.client, previous.client),
			};
		}
		return this.#graphDiff;
	}

	async #ensureDir(dir: URL): Promise<void> {
		const key = dir.href;
		if (this.#createdDirs.has(key)) return;
		await fs.promises.mkdir(dir, { recursive: true });
		this.#createdDirs.add(key);
	}
}
