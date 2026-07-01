import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ResolvedServerUrls } from 'vite';

/** Maximum time (ms) to wait for a process to exit after SIGTERM before escalating to SIGKILL. */
export const GRACEFUL_SHUTDOWN_TIMEOUT = 5000;

export interface LockFileData {
	pid: number;
	port: number;
	url: string;
	urls?: ResolvedServerUrls;
	background: boolean;
	startedAt: string;
}

export interface ExistingServer {
	data: LockFileData;
	stale: boolean;
}

/**
 * Get the URL of the dev lock file for a given project root.
 */
function getLockFileURL(root: URL): URL {
	return new URL('.astro/dev.json', root);
}

/**
 * Get the URL of the dev log file for a given project root.
 */
export function getLogFileURL(root: URL): URL {
	return new URL('.astro/dev.log', root);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isResolvedServerUrls(value: unknown): value is ResolvedServerUrls {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const { local, network } = value as Record<string, unknown>;
	return isStringArray(local) && isStringArray(network);
}

/**
 * Parse a lock file JSON string into a LockFileData object.
 * Returns null if the content is invalid.
 */
export function parseLockFile(content: string): LockFileData | null {
	try {
		const data = JSON.parse(content);
		if (
			typeof data.pid !== 'number' ||
			typeof data.port !== 'number' ||
			typeof data.url !== 'string' ||
			typeof data.background !== 'boolean' ||
			typeof data.startedAt !== 'string'
		) {
			return null;
		}
		// `urls` is optional, but if present it must have the expected shape.
		if (data.urls !== undefined && !isResolvedServerUrls(data.urls)) {
			return null;
		}
		return data as LockFileData;
	} catch {
		return null;
	}
}

/**
 * Serialize lock file data to a JSON string.
 */
export function serializeLockFile(data: LockFileData): string {
	return JSON.stringify(data, null, '\t');
}

/**
 * Check if a process with the given PID is alive.
 * Signal 0 does not kill the process — it only checks whether the process exists.
 */
export function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

/**
 * Read the lock file from disk. Returns null if it doesn't exist or is invalid.
 */
export function readLockFile(root: URL): LockFileData | null {
	const lockFileURL = getLockFileURL(root);
	try {
		const content = readFileSync(lockFileURL, 'utf-8');
		return parseLockFile(content);
	} catch {
		return null;
	}
}

/**
 * Write the lock file to disk.
 */
export function writeLockFile(root: URL, data: LockFileData): void {
	const lockFileURL = getLockFileURL(root);
	const dirPath = fileURLToPath(new URL('.astro/', root));
	try {
		if (!existsSync(dirPath)) {
			mkdirSync(dirPath, { recursive: true });
		}
		writeFileSync(lockFileURL, serializeLockFile(data), 'utf-8');
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Failed to write lock file: ${message}`);
	}
}

/**
 * Remove the lock file from disk. No-op if it doesn't exist.
 */
export function removeLockFile(root: URL): void {
	const lockFileURL = getLockFileURL(root);
	try {
		unlinkSync(lockFileURL);
	} catch (err: any) {
		// ENOENT means the file doesn't exist, which is fine.
		// Any other error (permissions, etc.) should be surfaced.
		if (err?.code !== 'ENOENT') {
			throw err;
		}
	}
}

/**
 * Given lock file data and a liveness result, determine the state of the existing server.
 * This is the pure decision logic, separated from I/O for testability.
 */
export function evaluateExistingServer(
	data: LockFileData | null,
	alive: boolean,
): ExistingServer | null {
	if (data === null) {
		return null;
	}
	return { data, stale: !alive };
}

/**
 * Check for an existing dev server by reading the lock file and checking process liveness.
 * Automatically cleans up stale lock files.
 * Returns the server info if a live server is found, null otherwise.
 */
export function checkExistingServer(root: URL): LockFileData | null {
	const data = readLockFile(root);
	const result = evaluateExistingServer(data, data !== null && isProcessAlive(data.pid));
	if (result === null) {
		return null;
	}
	if (result.stale) {
		removeLockFile(root);
		return null;
	}
	return result.data;
}
