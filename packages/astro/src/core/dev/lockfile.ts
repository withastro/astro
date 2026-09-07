import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import findProcess from 'find-proc';
import type { ResolvedServerUrls } from 'vite';

export type ServerCommand = 'dev' | 'preview';

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
 * Get the URL of a server lock file for a given project root.
 */
function getLockFileURL(root: URL, command: ServerCommand = 'dev'): URL {
	return new URL(`.astro/${command}.json`, root);
}

/**
 * Get the URL of a server log file for a given project root.
 */
export function getLogFileURL(root: URL, command: ServerCommand = 'dev'): URL {
	return new URL(`.astro/${command}.log`, root);
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

// Match Astro's published CLI entry and package-manager shims, not arbitrary files named astro.
const ASTRO_COMMAND_PATTERN =
	/(?:^|[\\/\s"'])(?:astro[\\/]bin[\\/]astro\.mjs|\.bin[\\/]astro(?:\.cmd)?)(?=$|[\s"'])/i;

/**
 * Check whether a process command points to the Astro CLI.
 */
export function isAstroCommand(command: string): boolean {
	return ASTRO_COMMAND_PATTERN.test(command);
}

interface ProcessInfo {
	pid: number;
	cmd?: string;
}

type ProcessLookup = (
	by: 'pid',
	value: number,
	options: { logLevel: 'error' },
) => Promise<ProcessInfo[]>;

/**
 * Check whether the live process recorded in a lock file is still Astro.
 * If the command cannot be inspected, keep the existing PID-only behavior.
 */
export async function isLockFileProcessAlive(
	data: LockFileData,
	find: ProcessLookup = findProcess,
): Promise<boolean> {
	// The current process cannot be the server recorded in the lock file — it hasn't
	// started one yet. In Docker containers the PID namespace resets on restart, so the
	// new `astro dev` process often inherits the same PID the old one had. Without this
	// guard, the process detects itself as the "already running" server. (#17744)
	if (data.pid === process.pid) {
		return false;
	}

	if (!isProcessAlive(data.pid)) {
		return false;
	}

	try {
		const processInfo = (await find('pid', data.pid, { logLevel: 'error' })).find(
			({ pid }) => pid === data.pid,
		);
		return processInfo?.cmd === undefined || isAstroCommand(processInfo.cmd);
	} catch {
		return true;
	}
}

/**
 * Read the lock file from disk. Returns null if it doesn't exist or is invalid.
 */
export function readLockFile(root: URL, command: ServerCommand = 'dev'): LockFileData | null {
	const lockFileURL = getLockFileURL(root, command);
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
export function writeLockFile(root: URL, data: LockFileData, command: ServerCommand = 'dev'): void {
	const lockFileURL = getLockFileURL(root, command);
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
export function removeLockFile(root: URL, command: ServerCommand = 'dev'): void {
	const lockFileURL = getLockFileURL(root, command);
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
 * Kill the dev server identified by `data` and clean up its lock file.
 *
 * Sends SIGTERM and waits up to {@link GRACEFUL_SHUTDOWN_TIMEOUT} for the
 * process to exit, escalating to SIGKILL if it is still alive. The lock file
 * is always removed afterwards so a new server can start.
 */
export async function killDevServer(root: URL, data: LockFileData): Promise<void> {
	try {
		process.kill(data.pid, 'SIGTERM');
	} catch {
		// Process may have already exited between check and kill
	}

	// Wait for graceful shutdown before escalating to SIGKILL
	const deadline = Date.now() + GRACEFUL_SHUTDOWN_TIMEOUT;
	while (Date.now() < deadline) {
		if (!isProcessAlive(data.pid)) break;
		await new Promise((r) => setTimeout(r, 100));
	}

	// If still alive after timeout, force kill
	if (isProcessAlive(data.pid)) {
		try {
			process.kill(data.pid, 'SIGKILL');
		} catch {
			// Already dead
		}
	}

	// Clean up the lock file in case the process didn't remove it
	removeLockFile(root);
}

/**
 * Check for an existing server by reading the lock file and checking process identity.
 * Automatically cleans up stale lock files.
 * Returns the server info if a live server is found, null otherwise.
 */
export async function checkExistingServer(
	root: URL,
	command: ServerCommand = 'dev',
): Promise<LockFileData | null> {
	const data = readLockFile(root, command);
	const result = evaluateExistingServer(
		data,
		data !== null && (await isLockFileProcessAlive(data)),
	);
	if (result === null) {
		return null;
	}
	if (result.stale) {
		removeLockFile(root, command);
		return null;
	}
	return result.data;
}
