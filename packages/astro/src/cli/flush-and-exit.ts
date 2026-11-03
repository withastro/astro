import type { Writable } from 'node:stream';

/**
 * Adds an `'error'` listener to each stream that ignores `EPIPE` (the reader closed
 * the pipe early, e.g. `astro check | head`) and rethrows any other error.
 */
export function ignoreEpipe(streams: Writable[] = [process.stdout, process.stderr]): void {
	for (const stream of streams) {
		stream.on('error', (err: NodeJS.ErrnoException) => {
			if (err.code !== 'EPIPE') throw err;
		});
	}
}

/**
 * Waits until every write already queued on the streams has been handled, then
 * calls `exit(code)`. Each stream's write callback runs even if the stream has
 * errored or been destroyed, so this cannot hang on a closed pipe.
 */
export async function flushAndExit(
	code: number,
	streams: Writable[] = [process.stdout, process.stderr],
	exit: (code: number) => void = process.exit,
): Promise<void> {
	// On POSIX, stdout/stderr pipes are asynchronous: writes the reader hasn't taken
	// yet stay in the stream buffer, and `process.exit()` discards them.
	// https://github.com/withastro/astro/issues/18600
	await Promise.all(
		streams.map((stream) => new Promise<void>((resolve) => stream.write('', () => resolve()))),
	);
	exit(code);
}
