import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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

export async function status({ flags }: { flags: Flags }): Promise<void> {
	const root = resolveRootURL(flags);
	const existing = checkExistingServer(root);

	if (!existing) {
		console.log(formatStatusOutput({ running: false }));
		return;
	}

	const startedAt = new Date(existing.startedAt).getTime();
	const uptime = Math.floor((Date.now() - startedAt) / 1000);

	console.log(
		formatStatusOutput({
			running: true,
			pid: existing.pid,
			url: existing.url,
			port: existing.port,
			background: existing.background,
			uptime,
		}),
	);
}
