import fs from 'node:fs';
import type { SerializedStaticImage } from '../../assets/types.js';
import type { AstroSettings } from '../../types/astro.js';

const INCREMENTAL_CACHE_FILE = 'incremental-build.json';
const INCREMENTAL_OUTPUT_DIR = 'dist/';
const CACHE_VERSION = 1;

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

function getManifestFile(settings: AstroSettings): URL {
	return new URL(INCREMENTAL_CACHE_FILE, settings.config.cacheDir);
}

function getCachedOutputFile(settings: AstroSettings, outputFile: string): URL {
	return new URL(outputFile, new URL(INCREMENTAL_OUTPUT_DIR, settings.config.cacheDir));
}

function readManifest(
	settings: AstroSettings,
	expectedConfigHash: string,
	expectedLockfileHash: string,
): IncrementalManifest | null {
	try {
		const raw = fs.readFileSync(getManifestFile(settings), 'utf-8');
		const data = JSON.parse(raw) as IncrementalManifest;
		if (data.version !== CACHE_VERSION) {
			return null;
		}
		// Output-affecting config changed since the cache was written, discard it.
		if (data.configHash !== expectedConfigHash) {
			return null;
		}
		// Dependencies changed since the cache was written, discard it.
		if (data.lockfileHash !== expectedLockfileHash) {
			return null;
		}
		return data;
	} catch {
		return null;
	}
}

/**
 * Tracks which prerendered paths can be reused from a previous build.
 *
 * The invalidation logic (`canSkip`, `record`, `findOrphanedFiles`) is pure and
 * operates on the previous and next manifests held in memory. Disk access is
 * confined to `load` and the output-file methods.
 */
export class IncrementalBuildCache {
	readonly #previous: IncrementalManifest | null;
	readonly #next: IncrementalManifest;
	readonly #contentEntryHashes: Map<string, string>;
	readonly #createdDirs = new Set<string>();

	constructor(
		configHash: string,
		lockfileHash: string,
		keyDigest: string,
		contentEntryHashes = new Map<string, string>(),
		previous: IncrementalManifest | null = null,
	) {
		this.#previous = previous;
		this.#contentEntryHashes = contentEntryHashes;
		this.#next = { version: CACHE_VERSION, configHash, lockfileHash, keyDigest, routes: {} };
	}

	/**
	 * Load the cache from disk. When no valid manifest exists (missing, wrong
	 * version, or a config or lockfile hash mismatch) the returned cache has no
	 * previous build, so every path is rendered as a full build.
	 *
	 * `contentEntryHashes` is this build's map of content-entry render hashes,
	 * used to detect when the content a path renders has changed.
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
		force = false,
	): IncrementalBuildCache {
		return new IncrementalBuildCache(
			configHash,
			lockfileHash,
			keyDigest,
			contentEntryHashes,
			force ? null : readManifest(settings, configHash, lockfileHash),
		);
	}

	/**
	 * Determine if a path can be reused from the previous build. A path is
	 * skippable when:
	 * 1. It returned a cacheKey in this build.
	 * 2. The previous cache has an entry for the route.
	 * 3. The route's dependency hash matches the previous build (template code is identical).
	 * 4. The previous cache has an entry for this exact path.
	 * 5. The path's cacheKey matches the previous build (user data is identical).
	 * 6. Every content entry the path rendered last build still has a matching
	 *    render hash (imported components inside that content are unchanged).
	 * 7. If the path renders a server island, the encryption key is unchanged, so
	 *    the ciphertext baked into the restored HTML is still decryptable.
	 */
	canSkip(
		routeComponent: string,
		pathname: string,
		dependencyHash: string,
		cacheKey: string,
		hasServerIsland = false,
	): boolean {
		const routeEntry = this.#previous?.routes[routeComponent];
		if (!routeEntry) return false;

		if (hasServerIsland && this.#previous?.keyDigest !== this.#next.keyDigest) return false;

		if (routeEntry.dependencyHash !== dependencyHash) return false;

		const pathEntry = routeEntry.paths[pathname];
		if (!pathEntry) return false;

		if (pathEntry.cacheKey !== cacheKey) return false;

		if (pathEntry.contentHashes) {
			for (const [entryPath, previousHash] of Object.entries(pathEntry.contentHashes)) {
				if (this.#contentEntryHashes.get(entryPath) !== previousHash) return false;
			}
		}

		return true;
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

	async #ensureDir(dir: URL): Promise<void> {
		const key = dir.href;
		if (this.#createdDirs.has(key)) return;
		await fs.promises.mkdir(dir, { recursive: true });
		this.#createdDirs.add(key);
	}
}
