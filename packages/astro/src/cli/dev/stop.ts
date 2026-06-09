import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { pathToFileURL } from 'node:url';
import {
	checkExistingServer,
	removeLockFile,
	isProcessAlive,
	GRACEFUL_SHUTDOWN_TIMEOUT,
} from '../../core/dev/lockfile.js';
import { resolveRoot } from '../../core/config/config.js';

export interface StopResult {
	stopped: boolean;
	pid?: number;
	reason?: string;
}

export function formatStopOutput(result: StopResult): string {
	return JSON.stringify(result);
}

export async function stop({
	flags,
	logger,
}: {
	flags: Flags;
	logger: AstroLogger;
}): Promise<void> {
	const root = pathToFileURL(resolveRoot(flags.root) + '/');
	const existing = checkExistingServer(root);

	if (!existing) {
		logger.info('SKIP_FORMAT', 'No dev server is running.');
		return;
	}

	try {
		process.kill(existing.pid, 'SIGTERM');
	} catch {
		// Process may have already exited between check and kill
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

	// Clean up the lock file in case the process didn't remove it
	removeLockFile(root);

	logger.info('SKIP_FORMAT', `Stopped dev server (pid ${existing.pid}).`);
}
