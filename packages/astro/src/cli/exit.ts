/**
 * Exits once stdout and stderr have flushed.
 *
 * On a pipe, Node queues a write the reader can't take yet, and `process.exit()` drops
 * the queue. A command that prints in a loop that never yields (like `astro check`)
 * then loses the end of its output whenever the reader is slower than the writer.
 */
export async function flushAndExit(code: number): Promise<never> {
	await Promise.all([flushed(process.stdout), flushed(process.stderr)]);
	process.exit(code);
}

// The callback of an empty write runs after every earlier write has flushed, or with an
// error once the stream is closed (e.g. `| head` exited); both mean nothing is left to wait for.
function flushed(stream: NodeJS.WriteStream): Promise<void> {
	return new Promise((resolve) => stream.write('', () => resolve()));
}
