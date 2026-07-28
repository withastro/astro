import fs from 'node:fs';
import type { AstroSettings } from '../../types/astro.js';

const INCREMENTAL_CACHE_FILE = 'incremental-build.json';
const INCREMENTAL_OUTPUT_DIR = 'dist/';
const CACHE_VERSION = 1;

export interface IncrementalPathEntry {
	cacheKey: string;
	outputFile: string;
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
	readonly #createdDirs = new Set<string>();

	constructor(configHash: string, previous: IncrementalManifest | null = null) {
		this.#previous = previous;
		this.#next = { version: CACHE_VERSION, configHash, routes: {} };
	}

	/**
	 * Load the cache from disk. When no valid manifest exists (missing, wrong
	 * version, or a config hash mismatch) the returned cache has no previous
	 * build, so every path is rendered as a full build.
	 */
	static load(settings: AstroSettings, configHash: string): IncrementalBuildCache {
		return new IncrementalBuildCache(configHash, readManifest(settings, configHash));
	}

	/**
	 * Determine if a path can be reused from the previous build. A path is
	 * skippable when:
	 * 1. It returned a cacheKey in this build.
	 * 2. The previous cache has an entry for the route.
	 * 3. The route's dependency hash matches the previous build (template code is identical).
	 * 4. The previous cache has an entry for this exact path.
	 * 5. The path's cacheKey matches the previous build (user data is identical).
	 */
	canSkip(
		routeComponent: string,
		pathname: string,
		dependencyHash: string,
		cacheKey: string | undefined,
	): boolean {
		if (cacheKey === undefined) return false;

		const routeEntry = this.#previous?.routes[routeComponent];
		if (!routeEntry) return false;

		if (routeEntry.dependencyHash !== dependencyHash) return false;

		const pathEntry = routeEntry.paths[pathname];
		if (!pathEntry) return false;

		return pathEntry.cacheKey === cacheKey;
	}

	/**
	 * Record a path in the next manifest. Paths without a cacheKey are never
	 * recorded, since they can never be skipped on a later build.
	 */
	record(
		routeComponent: string,
		dependencyHash: string,
		pathname: string,
		cacheKey: string | undefined,
		outputFile: string,
	): void {
		if (cacheKey === undefined) return;

		let routeEntry = this.#next.routes[routeComponent];
		if (!routeEntry) {
			routeEntry = { dependencyHash, paths: {} };
			this.#next.routes[routeComponent] = routeEntry;
		}
		routeEntry.dependencyHash = dependencyHash;
		routeEntry.paths[pathname] = { cacheKey, outputFile };
	}

	/**
	 * Output files present in the previous build but no longer produced by this
	 * one (for example a path removed from `getStaticPaths()`).
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
