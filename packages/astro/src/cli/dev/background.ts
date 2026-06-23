import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import {
	checkExistingServer,
	getLogFileURL,
	readLockFile,
	removeLockFile,
	isProcessAlive,
	GRACEFUL_SHUTDOWN_TIMEOUT,
	type LockFileData,
} from '../../core/dev/lockfile.js';
import { resolveRoot } from '../../core/config/config.js';

export interface BackgroundResult {
	pid: number;
	url: string;
	existing?: boolean;
}

export interface BackgroundErrorResult {
	error: string;
	message: string;
}

export function formatBackgroundOutput(result: BackgroundResult | BackgroundErrorResult): string {
	return JSON.stringify(result);
}

/**
 * Build the human-readable message shown when a background dev server is running.
 * Lists every network address (when `--host` exposed any) so the output matches
 * the foreground dev server, then appends the management command hints.
 */
export function formatServerRunningMessage(
	data: LockFileData,
	{ existing = false }: { existing?: boolean } = {},
): string {
	const lines = [
		`Dev server ${existing ? 'already running' : 'running'} at ${data.url} (pid ${data.pid})`,
	];
	if (data.urls && data.urls.network.length > 0) {
		lines.push('  Network:');
		for (const url of data.urls.network) {
			lines.push(`    ${url}`);
		}
	}
	lines.push('  Stop:   astro dev stop', '  Status: astro dev status', '  Logs:   astro dev logs');
	return lines.join('\n');
}

export async function background({
	flags,
	logger,
}: {
	flags: Flags;
	logger: AstroLogger;
}): Promise<void> {
	const root = pathToFileURL(resolveRoot(flags.root) + '/');

	// Check for existing server
	const existing = checkExistingServer(root);
	if (existing && !flags.force) {
		logger.info('SKIP_FORMAT', formatServerRunningMessage(existing, { existing: true }));
		return;
	}

	// If --force, kill the existing server first
	if (existing && flags.force) {
		try {
			process.kill(existing.pid, 'SIGTERM');
		} catch {
			// Already dead
		}
		// Wait for graceful shutdown before escalating to SIGKILL
		const deadline = Date.now() + GRACEFUL_SHUTDOWN_TIMEOUT;
		while (Date.now() < deadline) {
			if (!isProcessAlive(existing.pid)) break;
			await new Promise((r) => setTimeout(r, 100));
		}
		// If still alive after timeout, force kill
		if (isProcessAlive(existing.pid)) {
			try {
				process.kill(existing.pid, 'SIGKILL');
			} catch {
				// Already dead
			}
		}
		removeLockFile(root);
	}

	// Build the args for the child process: plain `astro dev` (no --background)
	const args: string[] = ['dev'];
	if (flags.port) args.push('--port', String(flags.port));
	if (flags.host != null) {
		if (typeof flags.host === 'string') {
			args.push('--host', flags.host);
		} else {
			args.push('--host');
		}
	}
	if (flags.config) args.push('--config', String(flags.config));
	if (flags.root) args.push('--root', String(flags.root));
	if (flags.allowedHosts) args.push('--allowed-hosts', String(flags.allowedHosts));
	if (flags.json) args.push('--json');

	// Open the log file for writing, ensuring the .astro directory exists
	const logFileURL = getLogFileURL(root);
	const logFilePath = fileURLToPath(logFileURL);
	const dotAstroDir = fileURLToPath(new URL('.astro/', root));
	if (!existsSync(dotAstroDir)) {
		mkdirSync(dotAstroDir, { recursive: true });
	}
	const logFd = openSync(logFilePath, 'w');

	// Spawn node directly with astro's entry point, bypassing the .bin shim.
	// On Windows, .bin shims are .cmd batch files that cannot be spawned without
	// a shell, so we avoid the shim entirely for cross-platform compatibility.
	const rootPath = fileURLToPath(root);
	const astroBin = resolve(rootPath, 'node_modules', 'astro', 'bin', 'astro.mjs');

	// Spawn the dev server as a detached child process
	const child = spawn(process.execPath, [astroBin, ...args], {
		detached: true,
		stdio: ['ignore', logFd, logFd],
		cwd: rootPath,
		env: { ...process.env, ASTRO_DEV_BACKGROUND: '1' },
	});

	child.unref();

	const childPid = child.pid;
	if (!childPid) {
		logger.error('SKIP_FORMAT', 'Failed to spawn background dev server process.');
		process.exit(1);
	}

	// Poll the lock file to detect when the server is ready
	const timeout = 30000;
	const deadline = Date.now() + timeout;

	while (Date.now() < deadline) {
		// Check if child is still alive
		if (!isProcessAlive(childPid)) {
			logger.error('SKIP_FORMAT', 'Dev server process exited before becoming ready.');
			process.exit(1);
		}

		// Check for the lock file (written by the child's dev server)
		const lockData = readLockFile(root);
		if (lockData && lockData.pid === childPid) {
			logger.info('SKIP_FORMAT', formatServerRunningMessage(lockData));
			return;
		}

		await new Promise((r) => setTimeout(r, 200));
	}

	// Timeout: kill the child and report failure
	try {
		process.kill(childPid, 'SIGTERM');
	} catch {
		// Already dead
	}
	removeLockFile(root);

	logger.error('SKIP_FORMAT', `Dev server failed to start within ${timeout / 1000}s.`);
	process.exit(1);
}
