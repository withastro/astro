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

export interface IncrementalCache {
	version: number;
	routes: Record<string, IncrementalRouteEntry>;
}

function getCacheFile(settings: AstroSettings): URL {
	return new URL(INCREMENTAL_CACHE_FILE, settings.config.cacheDir);
}

function getCachedOutputFile(settings: AstroSettings, outputFile: string): URL {
	return new URL(outputFile, new URL(INCREMENTAL_OUTPUT_DIR, settings.config.cacheDir));
}

const createdDirs = new Set<string>();

async function ensureDir(dir: URL): Promise<void> {
	const key = dir.href;
	if (createdDirs.has(key)) return;
	await fs.promises.mkdir(dir, { recursive: true });
	createdDirs.add(key);
}

export function readIncrementalCache(settings: AstroSettings): IncrementalCache | null {
	const cacheFile = getCacheFile(settings);
	try {
		const raw = fs.readFileSync(cacheFile, 'utf-8');
		const data = JSON.parse(raw) as IncrementalCache;
		if (data.version !== CACHE_VERSION) {
			return null;
		}
		return data;
	} catch {
		return null;
	}
}

export function writeIncrementalCache(settings: AstroSettings, cache: IncrementalCache): void {
	const cacheFile = getCacheFile(settings);
	const dir = new URL('./', cacheFile);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(cacheFile, JSON.stringify(cache, null, '\t'));
}

export async function restoreCachedOutputFile(
	settings: AstroSettings,
	outputFile: string,
	destination: URL,
): Promise<boolean> {
	const cachedOutputFile = getCachedOutputFile(settings, outputFile);
	if (!fs.existsSync(cachedOutputFile)) return false;

	await ensureDir(new URL('./', destination));
	await fs.promises.copyFile(cachedOutputFile, destination);
	return true;
}

export async function writeCachedOutputFile(
	settings: AstroSettings,
	outputFile: string,
	body: string | Uint8Array,
): Promise<void> {
	const cachedOutputFile = getCachedOutputFile(settings, outputFile);
	await ensureDir(new URL('./', cachedOutputFile));
	await fs.promises.writeFile(cachedOutputFile, body);
}

export async function deleteCachedOutputFile(
	settings: AstroSettings,
	outputFile: string,
): Promise<void> {
	await fs.promises.rm(getCachedOutputFile(settings, outputFile), { force: true });
}

export function createEmptyCache(): IncrementalCache {
	return { version: CACHE_VERSION, routes: {} };
}

/**
 * Determine if a path can be skipped based on the previous cache.
 * A path is skippable when:
 * 1. The route's dependency hash hasn't changed (template code is identical)
 * 2. The path's cacheKey hasn't changed (user data is identical)
 * 3. The path had a cacheKey in the previous build (wasn't a first build)
 */
export function canSkipPath(
	previousCache: IncrementalCache,
	routeComponent: string,
	pathname: string,
	currentDependencyHash: string,
	currentCacheKey: string | undefined,
): boolean {
	// No cacheKey provided — can't skip
	if (currentCacheKey === undefined) return false;

	const routeEntry = previousCache.routes[routeComponent];
	if (!routeEntry) return false;

	// Dependency hash changed — template or imports changed, must re-render all paths
	if (routeEntry.dependencyHash !== currentDependencyHash) return false;

	const pathEntry = routeEntry.paths[pathname];
	if (!pathEntry) return false;

	// CacheKey changed — user data changed, must re-render this path
	return pathEntry.cacheKey === currentCacheKey;
}

/**
 * Find output files from the previous cache that are no longer in the new cache.
 * These are orphaned files that should be deleted.
 */
export function findOrphanedFiles(
	previousCache: IncrementalCache,
	newCache: IncrementalCache,
): string[] {
	const orphans: string[] = [];
	for (const [routeComponent, routeEntry] of Object.entries(previousCache.routes)) {
		const newRouteEntry = newCache.routes[routeComponent];
		for (const [pathname, pathEntry] of Object.entries(routeEntry.paths)) {
			if (!newRouteEntry?.paths[pathname]) {
				orphans.push(pathEntry.outputFile);
			}
		}
	}
	return orphans;
}

/**
 * Record a path in the new cache.
 */
export function recordPath(
	cache: IncrementalCache,
	routeComponent: string,
	dependencyHash: string,
	pathname: string,
	cacheKey: string | undefined,
	outputFile: string,
): void {
	if (cacheKey === undefined) return;

	let routeEntry = cache.routes[routeComponent];
	if (!routeEntry) {
		routeEntry = { dependencyHash, paths: {} };
		cache.routes[routeComponent] = routeEntry;
	}
	routeEntry.dependencyHash = dependencyHash;
	routeEntry.paths[pathname] = {
		cacheKey,
		outputFile,
	};
}
