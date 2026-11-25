import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';

export function removeEmptyDirs(dir: string): void {
	if (!fs.statSync(dir).isDirectory()) return;
	let files = fs.readdirSync(dir);

	if (files.length > 0) {
		files.map((file) => {
			removeEmptyDirs(path.join(dir, file));
		});
		files = fs.readdirSync(dir);
	}

	if (files.length === 0) {
		fs.rmdirSync(dir);
	}
}

/**
 * Copies a cached file to `destination`, giving the copy the source file's
 * access and modification times so restored output reflects when it was cached.
 */
export async function copyCachedFile(source: fs.PathLike, destination: fs.PathLike): Promise<void> {
	await fs.promises.copyFile(source, destination, fs.constants.COPYFILE_FICLONE);
	// `copyFile` only keeps timestamps where the clone preserves them (macOS),
	// so they are set explicitly for consistent output across platforms (#18402).
	const { atime, mtime } = await fs.promises.stat(source);
	await fs.promises.utimes(destination, atime, mtime);
}

/**
 * Restores timestamps only for unchanged public files. Build plugins may have
 * overwritten the copied files, so matching paths (or sizes) alone are not enough.
 * Source symlinks are followed, like Vite's public copy; destination symlinks are
 * never followed, to avoid changing files outside the output directory.
 */
export async function copyTimestamps(srcDir: URL, destDir: URL): Promise<void> {
	async function visit(src: string, dest: string, ancestors: Set<string>): Promise<void> {
		try {
			const source = await fs.promises.stat(src);
			const destination = await fs.promises.lstat(dest);
			if (source.isDirectory() && destination.isDirectory()) {
				const realPath = await fs.promises.realpath(src);
				if (ancestors.has(realPath)) return;
				const parents = new Set(ancestors).add(realPath);
				// Walk sequentially to bound open files and comparison buffers, even
				// for large public directories. Also handles symlinked directories.
				for (const name of await fs.promises.readdir(src)) {
					await visit(path.join(src, name), path.join(dest, name), parents);
				}
			} else if (
				source.isFile() &&
				destination.isFile() &&
				source.size === destination.size &&
				(await filesHaveSameContents(src, dest, source.size))
			) {
				await fs.promises.utimes(dest, source.atime, source.mtime);
			}
		} catch (err: any) {
			// Files may have been removed or replaced by directories during build.
			if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') throw err;
		}
	}
	await visit(fileURLToPath(srcDir), fileURLToPath(destDir), new Set());
}

async function filesHaveSameContents(src: string, dest: string, size: number): Promise<boolean> {
	const source = await fs.promises.open(src, 'r');
	try {
		const destination = await fs.promises.open(dest, 'r');
		try {
			const sourceBuffer = Buffer.allocUnsafe(64 * 1024);
			const destinationBuffer = Buffer.allocUnsafe(64 * 1024);
			for (let position = 0; position < size; ) {
				const length = Math.min(sourceBuffer.length, size - position);
				const { bytesRead: sourceBytes } = await source.read(sourceBuffer, 0, length, position);
				const { bytesRead: destinationBytes } = await destination.read(
					destinationBuffer,
					0,
					length,
					position,
				);
				if (
					sourceBytes !== length ||
					destinationBytes !== length ||
					!sourceBuffer.subarray(0, length).equals(destinationBuffer.subarray(0, length))
				)
					return false;
				position += length;
			}
			return true;
		} finally {
			await destination.close();
		}
	} finally {
		await source.close();
	}
}

export function emptyDir(_dir: URL, skip?: Set<string>): void {
	const dir = fileURLToPath(_dir);
	if (!fs.existsSync(dir)) return undefined;
	for (const file of fs.readdirSync(dir)) {
		if (skip?.has(file)) {
			continue;
		}

		const p = path.resolve(dir, file);
		const rmOptions = { recursive: true, force: true, maxRetries: 3 };

		try {
			fs.rmSync(p, rmOptions);
		} catch (er: any) {
			if (er.code === 'ENOENT') {
				return;
			}
			if (er.code === 'EPERM' && isWindows) {
				fixWinEPERMSync(p, rmOptions, er);
			}
		}
	}
}

/**
 * https://github.com/isaacs/rimraf/blob/8c10fb8d685d5cc35708e0ffc4dac9ec5dd5b444/rimraf.js#L183
 * @license ISC
 * The ISC License
 *
 * Copyright (c) Isaac Z. Schlueter and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
const fixWinEPERMSync = (p: string, options: fs.RmOptions, er: any) => {
	try {
		fs.chmodSync(p, 0o666);
	} catch (er2: any) {
		if (er2.code === 'ENOENT') {
			return;
		} else {
			throw er;
		}
	}

	let stats;
	try {
		stats = fs.statSync(p);
	} catch (er3: any) {
		if (er3.code === 'ENOENT') {
			return;
		} else {
			throw er;
		}
	}

	if (stats.isDirectory()) {
		fs.rmSync(p, options);
	} else {
		fs.unlinkSync(p);
	}
};
