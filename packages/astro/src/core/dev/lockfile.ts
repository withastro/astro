import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ResolvedServerUrls } from 'vite';

export type ServerCommand = 'dev' | 'preview';

/** Maximum time (ms) to wait for a process to exit after SIGTERM before escalating to SIGKILL. */
export const GRACEFUL_SHUTDOWN_TIMEOUT = 5000;

export interface LockFileData {
	pid: number;
	port: number;
	url: string;
	urls?: ResolvedServerUrls;
	/**
	 * Kernel start time of `pid`, captured when the lock file was written (Linux only).
	 * Together with the PID it identifies the exact process instance, which survives PID
	 * recycling — a reused PID always has a different start time.
	 */
	pidStartTime?: string;
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
		// `pidStartTime` is optional, but if present it must be a string.
		if (data.pidStartTime !== undefined && typeof data.pidStartTime !== 'string') {
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
 * Read the kernel start time of a process from `/proc/<pid>/stat` (Linux only).
 * Together with the PID it uniquely identifies a process instance: a recycled PID
 * always belongs to a process with a different start time. Returns undefined when the
 * start time cannot be determined (unsupported platform, exited process, unreadable
 * or malformed stat).
 */
export function getProcessStartTime(pid: number): string | undefined {
	let stat: string;
	try {
		stat = readFileSync(`/proc/${pid}/stat`, 'utf-8');
	} catch {
		return undefined;
	}
	// The comm field (2) is wrapped in parentheses and may itself contain spaces or
	// parentheses, so the remaining fields are parsed after the final ')'.
	const closeParen = stat.lastIndexOf(')');
	if (closeParen === -1) {
		return undefined;
	}
	const fields = stat.slice(closeParen + 2).split(' ');
	// starttime is field 22 overall — index 19 of the fields after comm.
	return fields.length > 19 ? fields[19] : undefined;
}

/**
 * Clock ticks per second for the start time in `/proc/<pid>/stat` (USER_HZ).
 * 100 on mainstream Linux (x86, arm64).
 */
const PROC_STAT_TICKS_PER_SECOND = 100;

/**
 * Margin (ms) for the legacy lock file check below: the recorded process must have
 * started before the lock file was written, but the comparison inputs are soft —
 * `btime` shifts when the system clock steps (NTP, suspend/resume) and the file
 * mtime can come from a different clock (bind mounts, network filesystems). Only a
 * start time clearly past the write marks the lock file as stale; anything within
 * the margin is treated as alive, so a running server never loses its lock file.
 */
const LEGACY_LOCK_STALE_MARGIN_MS = 5000;

/**
 * Read the system boot time in seconds since the epoch from /proc/stat (Linux only).
 * Returns undefined when the boot time cannot be determined.
 */
function getBootTime(): number | undefined {
	let stat: string;
	try {
		stat = readFileSync('/proc/stat', 'utf-8');
	} catch {
		return undefined;
	}
	for (const line of stat.split('\n')) {
		if (line.startsWith('btime ')) {
			const seconds = Number(line.slice('btime '.length));
			return Number.isFinite(seconds) ? seconds : undefined;
		}
	}
	return undefined;
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
 * Write the lock file to disk. The kernel start time of the recorded PID is stored
 * alongside it when available, so later checks can tell the recorded process apart
 * from an unrelated one that recycled the PID.
 */
export function writeLockFile(root: URL, data: LockFileData, command: ServerCommand = 'dev'): void {
	const lockFileURL = getLockFileURL(root, command);
	const dirPath = fileURLToPath(new URL('.astro/', root));
	// `pidStartTime` is output-only: any caller-supplied value is replaced. undefined
	// (unsupported platform, exited process) is dropped by JSON serialization.
	const stamped = { ...data, pidStartTime: getProcessStartTime(data.pid) };
	try {
		if (!existsSync(dirPath)) {
			mkdirSync(dirPath, { recursive: true });
		}
		writeFileSync(lockFileURL, serializeLockFile(stamped), 'utf-8');
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
 * Check whether the process recorded in the lock file is still the process that
 * wrote it. PID existence alone is not enough: the kernel recycles PIDs, and inside
 * a Docker container an unrelated process quickly reuses the recorded PID after a
 * container restart while the lock file persists on a volume mount, making a stale
 * lock file look alive. https://github.com/withastro/astro/issues/17656
 *
 * The recorded start time is compared exactly when present. Lock files written
 * before process identity tracking carry none; there the process start time is
 * compared against the lock file's write time, with {@link LEGACY_LOCK_STALE_MARGIN_MS}
 * absorbing clock inaccuracies. When neither can be verified (a platform without
 * /proc), falls back to PID existence only.
 */
function isLockFileProcessAlive(lockFile: URL, data: LockFileData): boolean {
	if (!isProcessAlive(data.pid)) {
		return false;
	}
	const startTime = getProcessStartTime(data.pid);
	if (startTime === undefined) {
		return true;
	}
	if (data.pidStartTime !== undefined) {
		return startTime === data.pidStartTime;
	}
	let mtimeMs: number;
	try {
		mtimeMs = statSync(lockFile).mtimeMs;
	} catch {
		return true;
	}
	const bootTime = getBootTime();
	if (bootTime === undefined) {
		return true;
	}
	const processStartedAtMs = (bootTime + Number(startTime) / PROC_STAT_TICKS_PER_SECOND) * 1000;
	if (!Number.isFinite(processStartedAtMs)) {
		return true;
	}
	return processStartedAtMs <= mtimeMs + LEGACY_LOCK_STALE_MARGIN_MS;
}

/**
 * Check for an existing server by reading the lock file and verifying that the
 * recorded process is still the one that wrote it.
 * Automatically cleans up stale lock files.
 * Returns the server info if a live server is found, null otherwise.
 */
export function checkExistingServer(
	root: URL,
	command: ServerCommand = 'dev',
): LockFileData | null {
	const data = readLockFile(root, command);
	const result = evaluateExistingServer(
		data,
		data !== null && isLockFileProcessAlive(getLockFileURL(root, command), data),
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
