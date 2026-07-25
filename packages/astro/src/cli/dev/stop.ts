import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { pathToFileURL } from 'node:url';
import { checkExistingServer, killDevServer } from '../../core/dev/lockfile.js';
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

	await killDevServer(root, existing);

	logger.info('SKIP_FORMAT', `Stopped dev server (pid ${existing.pid}).`);
}
