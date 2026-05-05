import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { checkExistingServer, getLogFileURL } from '../../core/dev/lockfile.js';

function resolveRootURL(flags: Flags): URL {
	const rootPath = typeof flags.root === 'string' ? resolve(flags.root) : process.cwd();
	return pathToFileURL(rootPath + '/');
}

export async function logs({ flags, logger }: { flags: Flags; logger: AstroLogger }): Promise<void> {
	const root = resolveRootURL(flags);
	const existing = checkExistingServer(root);

	if (!existing) {
		logger.error(null, 'No dev server is running.');
		process.exitCode = 1;
		return;
	}

	if (!existing.background) {
		logger.error(
			null,
			'The running dev server was not started with --background. View logs in the terminal where it was started.',
		);
		process.exitCode = 1;
		return;
	}

	const logFileURL = getLogFileURL(root);
	const logFilePath = fileURLToPath(logFileURL);
	if (!existsSync(logFilePath)) {
		logger.error(null, 'No log file found.');
		process.exitCode = 1;
		return;
	}

	const content = readFileSync(logFilePath, 'utf-8');
	process.stdout.write(content);
}
