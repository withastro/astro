import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { checkExistingServer } from '../../core/dev/lockfile.js';

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

function resolveRootURL(flags: Flags): URL {
	const rootPath = typeof flags.root === 'string' ? resolve(flags.root) : process.cwd();
	return pathToFileURL(rootPath + '/');
}

export async function status({
	flags,
	logger,
}: { flags: Flags; logger: AstroLogger }): Promise<void> {
	const root = resolveRootURL(flags);
	const existing = checkExistingServer(root);

	if (!existing) {
		logger.info(null, 'No dev server is running.');
		return;
	}

	const startedAt = new Date(existing.startedAt).getTime();
	const uptime = Math.floor((Date.now() - startedAt) / 1000);

	logger.info(
		null,
		`Dev server running at ${existing.url} (pid ${existing.pid}, uptime ${uptime}s${existing.background ? ', background' : ''})`,
	);
}
