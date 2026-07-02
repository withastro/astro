import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { pathToFileURL } from 'node:url';
import { checkExistingServer } from '../../core/dev/lockfile.js';
import { resolveRoot } from '../../core/config/config.js';

export interface StatusResult {
	running: boolean;
	pid?: number;
	url?: string;
	port?: number;
	background?: boolean;
	uptime?: number;
}

export function formatStatusOutput(result: StatusResult): string {
	return JSON.stringify(result);
}

export async function status({
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

	const startedAt = new Date(existing.startedAt).getTime();
	const uptime = Math.floor((Date.now() - startedAt) / 1000);

	const lines = [
		`Dev server running at ${existing.url} (pid ${existing.pid}, uptime ${uptime}s${existing.background ? ', background' : ''})`,
	];
	if (existing.urls && existing.urls.network.length > 0) {
		lines.push('  Network:');
		for (const url of existing.urls.network) {
			lines.push(`    ${url}`);
		}
	}

	logger.info('SKIP_FORMAT', lines.join('\n'));
}
