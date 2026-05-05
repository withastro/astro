import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Flags } from '../flags.js';
import {
	checkExistingServer,
	getLogFileURL,
	readLockFile,
	removeLockFile,
	isProcessAlive,
} from '../../core/dev/lockfile.js';

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

function resolveRootURL(flags: Flags): URL {
	const rootPath = typeof flags.root === 'string' ? resolve(flags.root) : process.cwd();
	return pathToFileURL(rootPath + '/');
}

export async function background({ flags }: { flags: Flags }): Promise<void> {
	const root = resolveRootURL(flags);

	// Check for existing server
	const existing = checkExistingServer(root);
	if (existing && !flags.force) {
		console.log(
			formatBackgroundOutput({
				pid: existing.pid,
				url: existing.url,
				existing: true,
			}),
		);
		return;
	}

	// If --force, kill the existing server first
	if (existing && flags.force) {
		try {
			process.kill(existing.pid, 'SIGTERM');
		} catch {
			// Already dead
		}
		// Wait for it to die
		const deadline = Date.now() + 5000;
		while (Date.now() < deadline) {
			if (!isProcessAlive(existing.pid)) break;
			await new Promise((r) => setTimeout(r, 100));
		}
		removeLockFile(root);
	}

	// Build the args for the child process: `astro dev` without --background
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

	// Open the log file for writing, ensuring the .astro directory exists
	const logFileURL = getLogFileURL(root);
	const logFilePath = fileURLToPath(logFileURL);
	const dotAstroDir = fileURLToPath(new URL('.astro/', root));
	if (!existsSync(dotAstroDir)) {
		mkdirSync(dotAstroDir, { recursive: true });
	}
	const logFd = openSync(logFilePath, 'w');

	// Find the astro binary
	const rootPath = fileURLToPath(root);
	const astroBin = resolve(rootPath, 'node_modules', '.bin', 'astro');

	// Spawn the dev server as a detached child process
	const child = spawn(astroBin, args, {
		detached: true,
		stdio: ['ignore', logFd, logFd],
		cwd: rootPath,
		env: { ...process.env },
	});

	child.unref();

	const childPid = child.pid;
	if (!childPid) {
		console.log(
			formatBackgroundOutput({
				error: 'spawn_failed',
				message: 'Failed to spawn background dev server process.',
			}),
		);
		process.exitCode = 1;
		return;
	}

	// Poll the lock file to detect when the server is ready
	const timeout = 30000;
	const deadline = Date.now() + timeout;

	while (Date.now() < deadline) {
		// Check if child is still alive
		if (!isProcessAlive(childPid)) {
			console.log(
				formatBackgroundOutput({
					error: 'process_exited',
					message: 'Dev server process exited before becoming ready.',
				}),
			);
			process.exitCode = 1;
			return;
		}

		// Check for the lock file (written by the child's dev server)
		const lockData = readLockFile(root);
		if (lockData && lockData.pid === childPid) {
			console.log(
				formatBackgroundOutput({
					pid: lockData.pid,
					url: lockData.url,
				}),
			);
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

	console.log(
		formatBackgroundOutput({
			error: 'timeout',
			message: `Dev server failed to start within ${timeout / 1000}s.`,
		}),
	);
	process.exitCode = 1;
}
