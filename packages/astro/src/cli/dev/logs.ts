import { readFileSync, existsSync, statSync, createReadStream, watch } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AstroLogger } from '../../core/logger/core.js';
import type { Flags } from '../flags.js';
import { checkExistingServer, getLogFileURL, isProcessAlive } from '../../core/dev/lockfile.js';
import { resolveRoot } from '../../core/config/config.js';

export async function logs({
	flags,
	logger,
}: {
	flags: Flags;
	logger: AstroLogger;
}): Promise<void> {
	const root = pathToFileURL(resolveRoot(flags.root) + '/');
	const existing = checkExistingServer(root);

	if (!existing) {
		logger.error('SKIP_FORMAT', 'No dev server is running.');
		process.exit(1);
	}

	if (!existing.background) {
		logger.error(
			'SKIP_FORMAT',
			'The running dev server was not started with `astro dev --background`. View logs in the terminal where it was started.',
		);
		process.exit(1);
	}

	const logFileURL = getLogFileURL(root);
	const logFilePath = fileURLToPath(logFileURL);
	if (!existsSync(logFilePath)) {
		logger.error('SKIP_FORMAT', 'No log file found.');
		process.exit(1);
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

	// Clean up on termination signals
	const cleanup = () => {
		watcher.close();
		clearInterval(aliveCheck);
		process.exit(0);
	};
	process.on('SIGINT', cleanup);
	process.on('SIGTERM', cleanup);

	// Keep the process alive
	await new Promise(() => {});
}
