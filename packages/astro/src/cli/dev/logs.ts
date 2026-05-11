import { readFileSync, existsSync, statSync, createReadStream, watch } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { checkExistingServer, getLogFileURL, isProcessAlive } from '../../core/dev/lockfile.js';

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
			'The running dev server was not started with `astro dev background`. View logs in the terminal where it was started.',
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

	const follow = flags.follow || flags.f;

	if (!follow) {
		const content = readFileSync(logFilePath, 'utf-8');
		process.stdout.write(content);
		return;
	}

	// --follow mode: print existing content, then watch for new data
	let offset = statSync(logFilePath).size;

	// Print existing content
	if (offset > 0) {
		const content = readFileSync(logFilePath, 'utf-8');
		process.stdout.write(content);
	}

	// Watch the file for changes and stream new bytes
	const watcher = watch(logFilePath, () => {
		const currentSize = statSync(logFilePath).size;
		if (currentSize > offset) {
			const stream = createReadStream(logFilePath, { start: offset, encoding: 'utf-8' });
			stream.on('data', (chunk) => process.stdout.write(chunk));
			stream.on('end', () => {
				offset = currentSize;
			});
		}
	});

	// Periodically check if the server process is still alive
	const aliveCheck = setInterval(() => {
		if (!isProcessAlive(existing.pid)) {
			// Read any final bytes
			const currentSize = statSync(logFilePath).size;
			if (currentSize > offset) {
				const remaining = readFileSync(logFilePath, { encoding: 'utf-8' }).slice(offset);
				process.stdout.write(remaining);
			}
			watcher.close();
			clearInterval(aliveCheck);
		}
	}, 1000);

	// Clean up on Ctrl+C
	process.on('SIGINT', () => {
		watcher.close();
		clearInterval(aliveCheck);
		process.exit(0);
	});

	// Keep the process alive
	await new Promise(() => {});
}
