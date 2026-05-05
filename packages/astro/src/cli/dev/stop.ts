import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Flags } from '../flags.js';
import { checkExistingServer, removeLockFile } from '../../core/dev/lockfile.js';

export interface StopResult {
	stopped: boolean;
	pid?: number;
	reason?: string;
}

export function formatStopOutput(result: StopResult): string {
	return JSON.stringify(result);
}

function resolveRootURL(flags: Flags): URL {
	const rootPath = typeof flags.root === 'string' ? resolve(flags.root) : process.cwd();
	return pathToFileURL(rootPath + '/');
}

export async function stop({ flags }: { flags: Flags }): Promise<void> {
	const root = resolveRootURL(flags);
	const existing = checkExistingServer(root);

	if (!existing) {
		console.log(formatStopOutput({ stopped: false, reason: 'not_running' }));
		return;
	}

	try {
		process.kill(existing.pid, 'SIGTERM');
	} catch {
		// Process may have already exited between check and kill
	}

	// Wait briefly for the process to exit and clean up
	const deadline = Date.now() + 5000;
	while (Date.now() < deadline) {
		try {
			process.kill(existing.pid, 0);
		} catch {
			// Process is gone
			break;
		}
		await new Promise((r) => setTimeout(r, 100));
	}

	// Clean up the lock file in case the process didn't remove it
	removeLockFile(root);

	console.log(formatStopOutput({ stopped: true, pid: existing.pid }));
}
